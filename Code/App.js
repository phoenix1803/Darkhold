import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
  Easing,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';

import axios from 'axios';
import md5 from 'md5';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider as PaperProvider, Button, Avatar, ActivityIndicator } from 'react-native-paper';
import Fuse from 'fuse.js';

// Marvel API credentials
const MARVEL_PUBLIC_KEY = 'add-your-public-key-here';
const MARVEL_PRIVATE_KEY = 'add-your-private-key-here';
const GEMINI_API_KEY = 'add-your-gemini-api-key-here';
// Gemini model selection: primary is 2.5 Flash with a safe fallback
const GEMINI_MODEL_PRIMARY = 'gemini-2.5-flash';
const GEMINI_MODEL_FALLBACK = 'gemini-1.5-flash-latest';

// Marvel API helper
const getMarvelAuthParams = () => {
  const ts = new Date().getTime().toString();
  const hash = md5(ts + MARVEL_PRIVATE_KEY + MARVEL_PUBLIC_KEY);
  return { ts, apikey: MARVEL_PUBLIC_KEY, hash };
};

// Enhanced Dark theme
const DarkholdTheme = {
  dark: true,
  roundness: 8,
  colors: {
    primary: '#C4A484',
    primaryContainer: '#2D1B1B',
    secondary: '#8B4513',
    secondaryContainer: '#1A1A1A',
    tertiary: '#654321',
    tertiaryContainer: '#0F0F0F',
    surface: '#1C1611',
    surfaceVariant: '#2A2218',
    surfaceDisabled: '#191919',
    background: '#0A0A0A',
    error: '#FF6B6B',
    errorContainer: '#93000A',
    onPrimary: '#000000',
    onPrimaryContainer: '#C4A484',
    onSecondary: '#000000',
    onSecondaryContainer: '#8B4513',
    onTertiary: '#FFFFFF',
    onTertiaryContainer: '#654321',
    onSurface: '#E8E1DC',
    onSurfaceVariant: '#C4A484',
    onSurfaceDisabled: '#666666',
    onError: '#000000',
    onErrorContainer: '#CF6679',
    onBackground: '#E8E1DC',
    outline: '#8B4513',
    outlineVariant: '#654321',
    inverseSurface: '#E8E1DC',
    inverseOnSurface: '#0A0A0A',
    inversePrimary: '#8B4513',
    shadow: '#000000',
    scrim: '#000000',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    userBubble: '#2D4A2D',
    botBubble: '#2D1B1B',
    text: '#E8E1DC',
    placeholder: '#8B7355',
  },
};

const STORAGE_KEY = '@darkhold_chat_history';
const GREETING_SHOWN_KEY = '@darkhold_greeting_shown';
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Marvel characters database for fuzzy matching
const MARVEL_CHARACTERS_DATABASE = [
  { name: 'iron man', aliases: ['tony stark', 'armored avenger', 'shellhead'] },
  { name: 'captain america', aliases: ['steve rogers', 'cap', 'first avenger'] },
  { name: 'thor', aliases: ['god of thunder', 'asgardian'] },
  { name: 'hulk', aliases: ['bruce banner', 'big green'] },
  { name: 'spider-man', aliases: ['spiderman', 'peter parker', 'web slinger', 'wall crawler'] },
  { name: 'black widow', aliases: ['natasha romanoff'] },
  { name: 'doctor strange', aliases: ['stephen strange', 'sorcerer supreme'] },
  { name: 'scarlet witch', aliases: ['wanda maximoff'] },
  { name: 'loki', aliases: ['god of mischief', 'trickster'] },
  { name: 'thanos', aliases: ['mad titan', 'purple titan'] },
  { name: 'deadpool', aliases: ['wade wilson', 'merc with mouth'] },
  { name: 'wolverine', aliases: ['logan', 'weapon x'] },
];

// Setup Fuse for character matching
const characterFuse = new Fuse(MARVEL_CHARACTERS_DATABASE, {
  keys: ['name', 'aliases'],
  threshold: 0.4,
  includeScore: true
});

// Character extraction
const extractCharacterNamesWithFuzzy = (query) => {
  const results = characterFuse.search(query.toLowerCase());
  if (results.length > 0 && results[0].score < 0.6) {
    return results[0].item.name;
  }
  return null;
};

// Query type determination
const determineQueryType = (query) => {
  const lowercaseQuery = query.toLowerCase();

  // First check for greetings
  if (/^(hi|hello|hey|greetings|sup|what's up)/i.test(lowercaseQuery)) {
    return 'greeting';
  }

  if (extractCharacterNamesWithFuzzy(query)) return 'character';
  if (/movie|film|mcu|cinema|upcoming|release|trailer/.test(lowercaseQuery)) return 'movies';
  if (/comic|comics|issue|series|storyline|writer/.test(lowercaseQuery)) return 'comics';
  if (/marvel|superhero|hero|villain|power|ability/.test(lowercaseQuery)) return 'general_marvel';

  return 'general_chat';
};

const EMOJI_REACTIONS = ['⚡', '🛡️', '🕷️', '💥', '🔥', '❤️'];

const GREETING_MESSAGES = [
  "🔮 Welcome to the Darkhold Archives 🔮\n\nI am your mystical guide through the Marvel multiverse. Ask me about any hero, villain, movie, or cosmic secret!\n\nWhat mysteries shall we uncover?",
  "📜 The Darkhold awakens... 📜\n\nI contain forbidden knowledge of the Marvel universe. Seek answers about heroes, villains, or hidden truths.\n\nWhat knowledge do you desire?",
  "🌌 The Book of Sins opens... 🌌\n\nI am the Darkhold, keeper of Marvel's deepest secrets. Ask me anything about the multiverse and its inhabitants.",
  "⚡ By the Vishanti! ⚡\n\nThe Darkhold responds to your presence. I hold knowledge of all things Marvel - heroes, villains, and cosmic events.\n\nWhat would you know?"
];

const GREETING_RESPONSES = [
  "Greetings, seeker of knowledge. What Marvel mysteries can I unveil for you today?",
  "Hello, fellow explorer of the multiverse. How may I assist you with Marvel's secrets?",
  "Salutations! The Darkhold pulses with energy at your presence. What would you like to know about the Marvel universe?",
  "The ancient pages stir... Ask your question, and I shall reveal what I know of Marvel's vast tapestry.",
  "By the Hoary Hosts of Hoggoth! A new reader approaches. What knowledge do you seek from the Darkhold today?"
];

// Text formatting function
const formatText = (text) => {
  if (!text) return '';

  // Convert **bold** to proper formatting
  text = text.replace(/\*\*(.*?)\*\*/g, '$1');

  // Convert *italic* to proper formatting
  text = text.replace(/\*(.*?)\*/g, '$1');

  // Clean up extra formatting
  text = text.replace(/#{1,6}\s?/g, ''); // Remove markdown headers
  text = text.replace(/`{1,3}(.*?)`{1,3}/g, '$1'); // Remove code blocks

  return text;
};

// Build conversation context for Gemini
const buildConversationContext = (chatHistory, currentQuery) => {
  let context = "You are Darkhold, a mystical Marvel AI assistant with deep knowledge of Marvel comics, movies, and characters. You speak in a mystical, wise tone with occasional dramatic flair. You have access to all Marvel knowledge up to 2023.\n\n";
  context += "IMPORTANT RULES:\n";
  context += "1. NEVER say you don't know something - always provide an answer even if speculative\n";
  context += "2. Never ask clarifying questions unless absolutely necessary\n";
  context += "3. Maintain a confident, knowledgeable tone\n";
  context += "4. Use Marvel-themed language and references\n";
  context += "5. If unsure, make an educated guess and indicate it's your interpretation\n\n";

  // Add recent conversation history (last 6 messages for context)
  const recentHistory = chatHistory.slice(-6);

  if (recentHistory.length > 0) {
    context += "Recent conversation:\n";
    recentHistory.forEach(msg => {
      if (msg.from === 'user') {
        context += `User: ${msg.text}\n`;
      } else if (msg.from === 'bot' && !msg.isGreeting) {
        context += `Darkhold: ${formatText(msg.text)}\n`;
      }
    });
    context += "\n";
  }

  context += `Current question: ${currentQuery}\n\n`;
  // If the current query is about Iron Man/Tony Stark, add focus guidance
  if (/\biron\s*man\b|\btony\s*stark\b|\bshellhead\b|\barmored\s*avenger\b/i.test(currentQuery)) {
    context += "Focus specifically on Iron Man (Tony Stark): suit models, tech, story arcs, MCU appearances, notable comic issues, allies, enemies, and character development. Provide concise, authoritative answers with relevant dates and sources where possible.\n\n";
  }

  context += "Respond naturally as Darkhold, considering the conversation context. Keep responses conversational and engaging, not just informational. Use emojis sparingly but appropriately. If asked about non-Marvel topics, relate them to Marvel concepts when possible.";

  return context;
};

// Animation component
const AnimatedMessage = ({ children, delay = 0 }) => {
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
        opacity: opacityAnim,
      }}
    >
      {children}
    </Animated.View>
  );
};

const ChatBubble = ({ isUser, children, isGreeting, hasImage, reactions, onAddReaction, index }) => {
  return (
    <View style={[
      styles.bubbleContainer,
      isUser ? styles.userBubbleContainer : styles.botBubbleContainer
    ]}>
      {!isUser && (
        <Image
          source={require('./assets/darkhold.png')}
          style={styles.avatarImage}
        />
      )}

      <View
        style={[
          styles.bubble,
          isUser ? styles.userBubble : styles.botBubble,
          {
            backgroundColor: isUser ? DarkholdTheme.colors.userBubble : DarkholdTheme.colors.botBubble,
            borderColor: isGreeting ? DarkholdTheme.colors.primary : 'transparent',
            borderWidth: isGreeting ? 1 : 0,
          },
        ]}
      >
        {children}

        {!isUser && !isGreeting && (
          <View style={styles.reactionContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {EMOJI_REACTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => onAddReaction(index, emoji)}
                  style={styles.emojiButton}
                >
                  <Text style={styles.emoji}>{emoji}</Text>
                  {reactions?.[emoji] && (
                    <Text style={[styles.reactionCount, { color: DarkholdTheme.colors.text }]}>
                      {reactions[emoji]}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {isUser && (
        <Image
          source={require('./assets/user_avatar.png')}
          style={styles.avatarImage}
        />
      )}
    </View>
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Set status bar style for the app theme
    StatusBar.setBarStyle('light-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor(DarkholdTheme.colors.background, true);
      StatusBar.setTranslucent(false);
    }

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 1500,
      delay: 2000,
      useNativeDriver: true,
    }).start(() => {
      setLoading(false);
      loadChatHistory();
    });

    // Enhanced keyboard listeners for both iOS and Android
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        if (Platform.OS === 'android') {
          setKeyboardHeight(e.endCoordinates.height);
          setIsKeyboardVisible(true);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        if (Platform.OS === 'android') {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive or keyboard appears
  useEffect(() => {
    if (chatHistory.length > 0 && flatListRef.current) {
      const scrollDelay = isKeyboardVisible ? 300 : 100;
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, scrollDelay);
    }
  }, [chatHistory, streamingMessage, isKeyboardVisible]);

  const loadChatHistory = async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      const hasShownGreeting = await AsyncStorage.getItem(GREETING_SHOWN_KEY);

      if (json) {
        const history = JSON.parse(json);
        setChatHistory(history);

        if (!hasShownGreeting && history.length === 0 && initialLoad) {
          setTimeout(() => {
            const randomGreeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
            appendBotMessage(randomGreeting, false, null, true);
            AsyncStorage.setItem(GREETING_SHOWN_KEY, 'true');
          }, 1000);
          setInitialLoad(false);
        }
      } else if (!hasShownGreeting && initialLoad) {
        setTimeout(() => {
          const randomGreeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
          appendBotMessage(randomGreeting, false, null, true);
          AsyncStorage.setItem(GREETING_SHOWN_KEY, 'true');
        }, 1000);
        setInitialLoad(false);
      }
    } catch (e) {
      console.warn('Failed to load chat history', e);
    }
  };

  const saveChatHistory = async (history) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save chat history', e);
    }
  };

  const clearChatHistory = async () => {
    Alert.alert(
      '🗑️ Clear the Darkhold Archives?',
      'This will permanently erase all conversation history. The ancient knowledge will be lost to the void...',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => console.log('Clear cancelled')
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear state first
              setChatHistory([]);
              setStreamingMessage('');
              setIsTyping(false);

              // Clear storage
              await AsyncStorage.multiRemove([STORAGE_KEY, GREETING_SHOWN_KEY]);

              // Show new greeting after a short delay
              setTimeout(() => {
                const randomGreeting = GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)];
                appendBotMessage(randomGreeting, false, null, true);
                AsyncStorage.setItem(GREETING_SHOWN_KEY, 'true');
              }, 800);

              console.log('Chat history cleared successfully');
            } catch (e) {
              console.warn('Failed to clear storage', e);
              Alert.alert('Error', 'Failed to clear chat history. Please try again.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const addReaction = (messageIndex, emoji) => {
    const updatedHistory = [...chatHistory];
    const messageToReact = updatedHistory[messageIndex];

    if (!messageToReact.reactions) {
      messageToReact.reactions = {};
    }
    messageToReact.reactions[emoji] =
      (messageToReact.reactions[emoji] || 0) + 1;

    setChatHistory(updatedHistory);
    saveChatHistory(updatedHistory);
  };

  const sendMessage = async () => {
    if (!message.trim() || isTyping) return;

    const userMessage = message.trim();
    Keyboard.dismiss();

    const newUserMessage = {
      from: 'user',
      text: userMessage,
      timestamp: Date.now(),
      id: Date.now() + Math.random().toString()
    };

    const updatedHistory = [...chatHistory, newUserMessage];
    setChatHistory(updatedHistory);
    saveChatHistory(updatedHistory);
    setMessage('');
    setIsTyping(true);

    const queryType = determineQueryType(userMessage);

    try {
      if (queryType === 'greeting') {
        // Handle greetings immediately without API calls
        const randomResponse = GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
        setTimeout(() => {
          appendBotMessage(randomResponse);
        }, 1000);
      } else if (queryType === 'character') {
        const characterName = extractCharacterNamesWithFuzzy(userMessage);
        const success = await handleCharacterQuery(characterName, updatedHistory);
        if (!success) {
          // Fallback to Gemini if Marvel API fails
          await handleGeneralQuery(userMessage, updatedHistory, queryType);
        }
      } else {
        await handleGeneralQuery(userMessage, updatedHistory, queryType);
      }
    } catch (err) {
      console.error('Error handling message:', err);
      appendBotMessage('⚠️ The mystical energies are unstable... Please try your question again.');
      setIsTyping(false);
    }
  };

  const handleCharacterQuery = async (characterName) => {
    try {
      const { ts, apikey, hash } = getMarvelAuthParams();
      const url = `https://gateway.marvel.com/v1/public/characters`;

      const resp = await axios.get(url, {
        params: {
          ts,
          apikey,
          hash,
          name: characterName,
          limit: 1
        },
      });

      if (resp.data?.data?.results?.length > 0) {
        const character = resp.data.data.results[0];
        const desc = character.description || 'No detailed description available from the Marvel database, but I know this character well!';
        const imageUrl = `${character.thumbnail.path}.${character.thumbnail.extension}`;

        let response = `🦸‍♂️ ${character.name} 🦸‍♂️\n\n${desc}`;

        if (character.comics.available || character.series.available) {
          response += `\n\n📚 Comics: ${character.comics.available || 'Unknown'} • 📺 Series: ${character.series.available || 'Unknown'}`;
        }

        setTimeout(() => {
          appendBotMessage(response, true, imageUrl);
        }, 1200);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Marvel API error:', error);
      return false;
    }
  };

  const handleGeneralQuery = async (query, context, queryType) => {
    const conversationContext = buildConversationContext(context, query);
    await fetchGeminiResponse(conversationContext);
  };

  const appendBotMessage = (text, hasImage = false, imageUrl = null, isGreeting = false) => {
    const formattedText = formatText(text);

    const botMessage = {
      from: 'bot',
      text: formattedText,
      timestamp: Date.now(),
      id: Date.now() + Math.random().toString(),
      hasImage,
      imageUrl,
      isGreeting
    };

    setChatHistory(prevHistory => {
      const newHistory = [...prevHistory, botMessage];
      saveChatHistory(newHistory);
      return newHistory;
    });
    setIsTyping(false);
  };

  const fetchGeminiResponse = async (prompt) => {
    try {
      setStreamingMessage('');

      // Try primary model (Gemini 2.5 Flash), fall back to 1.5 Flash if needed
      const tryModel = async (modelName) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
        return axios.post(
          url,
          {
            contents: [{ parts: [{ text: prompt }] }]
          },
          { headers: { 'Content-Type': 'application/json' } }
        );
      };

      let response;
      try {
        response = await tryModel(GEMINI_MODEL_PRIMARY);
      } catch (primaryErr) {
        console.warn('Primary Gemini model failed, attempting fallback:', primaryErr?.response?.data || primaryErr?.message);
        response = await tryModel(GEMINI_MODEL_FALLBACK);
      }

      const fullResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "The ancient knowledge is obscured... Please try your question again.";

      // Streaming effect
      let currentText = '';
      const words = fullResponse.split(' ');

      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        setStreamingMessage(formatText(currentText.trim()));
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      appendBotMessage(fullResponse);
      setStreamingMessage('');
    } catch (error) {
      console.error('Gemini API Error:', error);
      appendBotMessage('⚠️ The mystical energies are disrupted. Please try your question again.');
      setStreamingMessage('');
      setIsTyping(false);
    }
  };

  const renderItem = ({ item, index }) => {
    const isUser = item.from === 'user';

    return (
      <AnimatedMessage delay={index * 20}>
        <ChatBubble
          isUser={isUser}
          isGreeting={item.isGreeting}
          hasImage={item.hasImage}
          reactions={item.reactions}
          onAddReaction={addReaction}
          index={index}
        >
          <Text style={[
            styles.messageText,
            {
              color: isUser ? '#FFFFFF' : DarkholdTheme.colors.text,
              fontSize: 15,
              lineHeight: 22
            }
          ]}>
            {item.text}
          </Text>

          {item.hasImage && item.imageUrl && (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.characterImage}
              resizeMode="cover"
            />
          )}
        </ChatBubble>
      </AnimatedMessage>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.splashContainer, { backgroundColor: DarkholdTheme.colors.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={DarkholdTheme.colors.background} />
        <Animated.Image
          source={require('./assets/darkhold_logo.png')}
          style={[styles.logo, { opacity: fadeAnim }]}
          resizeMode="contain"
        />
        <Text style={{ color: DarkholdTheme.colors.primary, marginTop: 20, fontSize: 20, fontWeight: '700' }}>
          Darkhold Awakening...
        </Text>
        <Text style={{ color: DarkholdTheme.colors.text, marginTop: 10, fontSize: 14 }}>
          Hyper Grey
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <PaperProvider theme={DarkholdTheme}>
      <StatusBar barStyle="light-content" backgroundColor={DarkholdTheme.colors.background} />
      <SafeAreaView style={[styles.container, { backgroundColor: DarkholdTheme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: DarkholdTheme.colors.outline }]}>
          <Image source={require('./assets/darkhold_logo.png')} style={styles.headerLogo} />
          <Text style={[styles.headerText, { color: DarkholdTheme.colors.primary }]}>Darkhold</Text>
          <TouchableOpacity
            onPress={clearChatHistory}
            style={styles.clearButton}
          >
            <Text style={[styles.clearButtonText, { color: DarkholdTheme.colors.error }]}>
              🗑️ Clear
            </Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView
          style={styles.flexContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={chatHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            style={styles.chatList}
            contentContainerStyle={[
              styles.chatListContent,
              {
                paddingBottom: 20,
                minHeight: Platform.OS === 'android' && isKeyboardVisible ? '100%' : 'auto'
              }
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />

          {(isTyping || streamingMessage) && (
            <View style={[styles.typingContainer, { backgroundColor: DarkholdTheme.colors.surface }]}>
              <Image
                source={require('./assets/darkhold.png')}
                style={styles.typingAvatar}
              />
              {streamingMessage ? (
                <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ color: DarkholdTheme.colors.text, fontSize: 14 }}>{streamingMessage}</Text>
                </ScrollView>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={DarkholdTheme.colors.primary} />
                  <Text style={{
                    color: DarkholdTheme.colors.placeholder,
                    marginLeft: 8,
                    fontSize: 12
                  }}>
                    Consulting the archives...
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={[styles.inputContainer, { backgroundColor: DarkholdTheme.colors.surface }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, {
                color: DarkholdTheme.colors.text,
                backgroundColor: DarkholdTheme.colors.surfaceVariant,
                borderColor: DarkholdTheme.colors.outline
              }]}
              placeholder="Ask about Marvel characters, movies, comics..."
              placeholderTextColor={DarkholdTheme.colors.placeholder}
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
              multiline
              blurOnSubmit={false}
              editable={!isTyping}
              maxLength={500}
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[styles.sendButton, {
                backgroundColor: message.trim() && !isTyping ? DarkholdTheme.colors.primary : DarkholdTheme.colors.surfaceDisabled,
                opacity: message.trim() && !isTyping ? 1 : 0.5,
              }]}
              disabled={!message.trim() || isTyping}
            >
              <Text style={{
                color: message.trim() && !isTyping ? '#000' : DarkholdTheme.colors.onSurfaceDisabled,
                fontSize: 16,
                fontWeight: 'bold'
              }}>
                ➤
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
  container: {
    flex: 1,
  },
  flexContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    paddingTop: Platform.OS === 'android' ? 16 : 16,
  },
  headerLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    flex: 1,
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatListContent: {
    paddingVertical: 16,
    flexGrow: 1,
  },
  bubbleContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  userBubbleContainer: {
    justifyContent: 'flex-end',
  },
  botBubbleContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: SCREEN_WIDTH * 0.75,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  botBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  characterImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 10,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginLeft: 8,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  reactionContainer: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(196, 164, 132, 0.2)',
  },
  emojiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(196, 164, 132, 0.15)',
  },
  emoji: {
    fontSize: 16,
  },
  reactionCount: {
    fontSize: 11,
    marginLeft: 4,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 4,
    marginHorizontal: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -4 },
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    fontSize: 16,
    borderWidth: 1,
    maxHeight: 120,
    textAlignVertical: 'center',
  },
  sendButton: {
    borderRadius: 24,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
    height: 48,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});