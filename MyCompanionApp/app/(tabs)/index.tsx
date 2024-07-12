import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Image, StatusBar } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Index = () => {
    const cloudAnimation = useRef(new Animated.Value(0)).current;
    const characterAnimation = useRef(new Animated.Value(0)).current;
    const zzzAnimation = useRef(new Animated.Value(0)).current;
    const 
    const websocketRef = useRef<WebSocket | null>(null);
    const timerRef = useRef(null);

    const initialTamagotchiState = {
        faim: 50,
        bonheur: 50,
        energie: 50,
        canFeed: true,
        canPlay: true,
        canRest: true,
        timeToFeed: 15,
        timeToPlay: 15,
        timeToRest: 15,
        level: 1,
        isGameOver: false,
        isResting: false,
    };

    const [tamagotchi, setTamagotchi] = useState(initialTamagotchiState);
    const [loading, setLoading] = useState(false);
    const [information, setInformation] = useState('Bienvenue dans le Monde des AmiAmi');
    const [timerCount, setTimerCount] = useState(0);

    useEffect(() => {
        connectWebSocket();
        loadGameState();
        startTimer();
        animateClouds(); // Démarrer l'animation des nuages
        return () => {
            if (websocketRef.current) {
                (websocketRef.current as WebSocket).close();
            }
            saveGameState();
            stopTimer();
        };
    }, []);

    useEffect(() => {
        if (tamagotchi.isGameOver) {
            setInformation('AmiAmi est mort 😓. Retentez votre chance.');
            Speech.speak('AmiAmi est mort. Retentez votre chance.');
            stopTimer();
        }
    }, [tamagotchi.isGameOver]);

    useEffect(() => {
        if (timerCount > 0 && timerCount % 30 === 0 && !tamagotchi.isGameOver) {
            levelUp();
        }
    }, [timerCount]);

    const animateClouds = () => {
      Animated.loop(
          Animated.sequence([
              Animated.timing(cloudAnimation, {
                  toValue: 1,
                  duration: 6000,
                  useNativeDriver: true,
              }),
              Animated.timing(cloudAnimation, {
                  toValue: 0,
                  duration: 6000,
                  useNativeDriver: true,
              }),
          ])
      ).start();
  };

    const animateCharacter = () => {
        Animated.sequence([
            Animated.timing(characterAnimation, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(characterAnimation, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const animateZzz = () => {
        zzzAnimation.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(zzzAnimation, {
                    toValue: -10,
                    duration: 10000,
                    useNativeDriver: true,
                }),
                Animated.timing(zzzAnimation, {
                    toValue: 0,
                    duration: 10000,
                    useNativeDriver: true,
                }),
            ]),
            { iterations: 3 }
        ).start();
    };

    const connectWebSocket = () => {
        websocketRef.current = new WebSocket('ws://localhost:5000');

        websocketRef.current.onopen = () => {
            console.log('WebSocket Client Connected');
            let actionText = "Connexion établie avec le serveur.";
            setInformation(actionText);
        };

        websocketRef.current.onmessage = (e) => {
            const updatedState = JSON.parse(e.data);
            setTamagotchi(updatedState);
            animateCharacter(); // Animate character on state update
        };

        websocketRef.current.onerror = (error) => {
            console.error('WebSocket Error:', error);
        };

        websocketRef.current.onclose = (e) => {
            console.log('WebSocket closed:', e);
        };
    };

    const interactWithTamagotchi = (action: string) => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN && !tamagotchi.isGameOver) {
            setLoading(true);
            let actionText = '';

            switch (action) {
                case 'nourrir':
                    actionText = "Vous nourrissez votre AmiAmi.";
                    break;
                case 'jouer':
                    actionText = "Vous jouez avec votre AmiAmi.";
                    break;
                case 'reposer':
                    actionText = "Votre AmiAmi dort.";
                    animateZzz();
                    setTamagotchi(prevState => ({ ...prevState, isResting: true }));
                    break;
                default:
                    actionText = `Action ${action} en cours.`;
                    break;
            }

            Speech.speak(actionText);
            setInformation(actionText);
            websocketRef.current.send(JSON.stringify({ type: action }));

            setTimeout(() => {
                setLoading(false);
                setTamagotchi(prevState => ({ ...prevState, isResting: false }));

                if (tamagotchi.faim <= 0 || tamagotchi.bonheur <= 0 || tamagotchi.energie <= 0) {
                    setTamagotchi(prevState => ({
                        ...prevState,
                        isGameOver: true,
                    }));
                }
            }, 1000);
        }
    };

    const levelUp = () => {
        setTamagotchi(prevState => ({
            ...prevState,
            level: prevState.level + 1,
        }));
        setInformation('Votre AmiAmi a passé au niveau suivant !');
        Speech.speak('Votre AmiAmi a passé au niveau suivant !');
        setTimerCount(0);
    };

    const restartTamagotchi = async () => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({ type: 'restart' }));
            setTamagotchi(initialTamagotchiState);
            setTimerCount(0);
            setInformation('Aide ton AmiAmi a survivre.');
            Speech.speak('Aide ton AmiAmi a survivre.');
            startTimer();
            await AsyncStorage.removeItem('tamagotchiState');
        }
    };

    const startTimer = () => {
        stopTimer();
        timerRef.current = setInterval(() => {
            setTimerCount(prevCount => prevCount + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const saveGameState = async () => {
        try {
            await AsyncStorage.setItem('tamagotchiState', JSON.stringify(tamagotchi));
        } catch (error) {
            console.error('Error saving game state:', error);
            let actionText = "Erreur lors de la sauvegarde de l'état du jeu.";
            setInformation(actionText);
        }
    };

    const loadGameState = async () => {
        try {
            const savedState = await AsyncStorage.getItem('tamagotchiState');
            if (savedState) {
                setTamagotchi(JSON.parse(savedState));
            }
        } catch (error) {
            console.error('Error loading game state:', error);
            let actionText = "Erreur lors du chargement de l'état du jeu.";
            setInformation(actionText);
        }
    };

    const cloudTransform = cloudAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [-20, 20],
    });

    const characterPosition = characterAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
    });

    const zzzPosition = zzzAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 10],
    });

    const faimWidth = (tamagotchi.faim / 100) * 200;
    const bonheurWidth = (tamagotchi.bonheur / 100) * 200;
    const energieWidth = (tamagotchi.energie / 100) * 200;

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <View style={styles.wrapper}>
                <View style={styles.background} />
                <View style={styles.cloudContainer}>
                    <Animated.Image
                        source={require('/home/stephanedn/code/SDN33/MyCompanionAppBackend/MyCompanionApp/assets/images/cloud.png')}
                        style={[styles.cloudImage, { transform: [{ translateX: cloudTransform }] }]}
                    />
                </View>
                <Image source={require('../../assets/images/landscape.png')} style={styles.landImage} />
                <Text style={styles.header}>Bienvenue dans le Monde des AmiAmi</Text>

                <Text style={styles.information}>{information}</Text>

                <View style={styles.characterContainer}>
                    <Animated.Image
                        source={require('/home/stephanedn/code/SDN33/MyCompanionAppBackend/MyCompanionApp/assets/images/tamagotchi.png')}
                        style={[styles.character, { transform: [{ translateY: characterPosition }] }]}
                        resizeMode="contain"
                    />
                    {tamagotchi.isResting && (
                        <Animated.Text style={[styles.zzz, { transform: [{ translateY: zzzPosition }] }]}>Zzz</Animated.Text>
                    )}
                </View>

                <TouchableOpacity style={[styles.button, styles.restartButton]} onPress={restartTamagotchi} disabled={loading}>
                        <Text style={styles.buttonText}>Recommencer</Text>
                    </TouchableOpacity>

                <View style={styles.statsContainer}>
                    <View style={styles.levelContainer}>
                      <Image source={require('/home/stephanedn/code/SDN33/MyCompanionAppBackend/MyCompanionApp/assets/images/star.png')} style={styles.levelImage} />
                      <Text style={styles.levelText}>{tamagotchi.level}</Text>
                    </View>
                    <Text style={styles.statsText}>Temps écoulé : {timerCount} sec</Text>

                    <View style={styles.statBarContainer}>
                        <Text style={styles.statsText}>Faim 🤤 :  </Text>
                        <View style={[styles.statBar, { width: faimWidth, backgroundColor: tamagotchi.canFeed ? 'orange' : 'orange' }]} />
                        <Text style={styles.statsText}>  {tamagotchi.faim}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                        <Text style={styles.statsText}>Bonheur 🥰 :  </Text>
                        <View style={[styles.statBar, { width: bonheurWidth, backgroundColor: tamagotchi.canPlay ? 'blue' : 'blue' }]} />
                        <Text style={styles.statsText}>  {tamagotchi.bonheur}</Text>
                    </View>
                    <View style={styles.statBarContainer}>
                        <Text style={styles.statsText}>Énergie 💪 :  </Text>
                        <View style={[styles.statBar, { width: energieWidth, backgroundColor: tamagotchi.canRest ? 'purple' : 'purple' }]} />
                        <Text style={styles.statsText}>  {tamagotchi.energie}</Text>
                    </View>
                </View>
                <View style={styles.buttonContainer}>
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={[styles.button, !tamagotchi.canFeed || loading || tamagotchi.isGameOver ? styles.disabledButton : { backgroundColor: 'orange' }]} onPress={() => interactWithTamagotchi('nourrir')} disabled={!tamagotchi.canFeed || loading || tamagotchi.isGameOver}>
                            <Text style={styles.buttonText}>Nourrir</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, !tamagotchi.canPlay || loading || tamagotchi.isGameOver ? styles.disabledButton : { backgroundColor: 'blue' }]} onPress={() => interactWithTamagotchi('jouer')} disabled={!tamagotchi.canPlay || loading || tamagotchi.isGameOver}>
                            <Text style={styles.buttonText}>Jouer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, !tamagotchi.canRest || loading || tamagotchi.isGameOver ? styles.disabledButton : { backgroundColor: 'purple' }]} onPress={() => interactWithTamagotchi('reposer')} disabled={!tamagotchi.canRest || loading || tamagotchi.isGameOver}>
                            <Text style={styles.buttonText}>Reposer</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                {loading && <ActivityIndicator size="large" color="#0000ff" />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    wrapper: {
        width: '80%',
        maxWidth: 600,
        padding: 20,
        borderRadius: 10,
        backgroundColor: 'WHITE',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 2,
        elevation: 5,
    },
    background: {
        position: 'absolute',
        backgroundColor: 'lightblue',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: 'orange',
        textShadowColor: '#000000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        backgroundColor: 'white',
        opacity: 0.9,
    },
    characterContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    character: {
        width: 150,
        height: 150,
        resizeMode: 'contain',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 3,
        elevation: 5,
    },
    zzz: {
        position: 'absolute',
        top: -10,
        left: 250,
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    statsContainer: {
        marginBottom: 20,
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 10,
        padding: 10,
    },
    statsText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: 'white',
    },
    statBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
        backgroundColor: '#424242',
        borderRadius: 5,
        overflow: 'hidden',
        paddingLeft: 10,
    },
    statBar: {
        height: 10,
        borderRadius: 5,
    },
    buttonContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    restartButton: {
        backgroundColor: '#f44336',
        marginBottom: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 20,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 5,
        marginHorizontal: 5,
        backgroundColor: '#757575',
        borderEndEndRadius: 10,
    },
    disabledButton: {
        backgroundColor: '#bdbdbd',
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
    },
    information: {
        fontSize: 18,
        color: 'black',
        textAlign: 'center',
        marginTop: 10,
        marginBottom: 20,
        backgroundColor: 'white',


    },
    levelContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    levelImage: {
        width: 50,
        height: 50,
        marginRight: 0,
    },
    levelText: {
        position: 'absolute',
        fontSize: 20,
        fontWeight: 'bold',
        color: 'darkorange',
        textShadowColor: 'black',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
        textAlign: 'center',
        width: 50,
        height: 50,
        lineHeight: 50, // To center the text vertically
    },

    cloudImage: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 600,
        height: 150,
    },

    cloudContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 600,
        height: 150,
        overflow: 'hidden',
    },

    landImage: {
        width: 600,
        height: 350,
        position: 'absolute',
        top: -50,
        left: 0,
    },
});

export default Index;
