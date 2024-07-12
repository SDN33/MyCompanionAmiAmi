import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Animated, Image, StatusBar } from 'react-native';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Index = () => {
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
    };

    const [tamagotchi, setTamagotchi] = useState(initialTamagotchiState);
    const [loading, setLoading] = useState(false);
    const [information, setInformation] = useState('Bienvenue dans le Monde des AmiAmi');
    const [characterAnimation] = useState(new Animated.Value(0));
    const [timerCount, setTimerCount] = useState(0);
    const websocketRef = useRef(null);
    const timerRef = useRef(null);

    useEffect(() => {
        connectWebSocket();
        loadGameState(); // Charger l'état du jeu sauvegardé
        startTimer();
        return () => {
            if (websocketRef.current) {
                websocketRef.current.close();
            }
            saveGameState(); // Sauvegarder l'état du jeu en partant
            stopTimer();
        };
    }, []);

    useEffect(() => {
        // Effet secondaire pour vérifier la fin du jeu
        if (tamagotchi.isGameOver) {
            setInformation('AmiAmi est mort. Retentez votre chance.');
            Speech.speak('AmiAmi est mort. Retentez votre chance.', {
                voiceLocale: 'fr-FR'
            });
            stopTimer();
        }
    }, [tamagotchi.isGameOver]);

    useEffect(() => {
        // Effet secondaire pour vérifier le niveau toutes les 30 secondes
        if (timerCount > 0 && timerCount % 30 === 0 && !tamagotchi.isGameOver) {
            levelUp();
        }
    }, [timerCount]);

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

    const interactWithTamagotchi = (action) => {
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
                    break;
                default:
                    actionText = `Action ${action} en cours.`;
                    break;
            }

            // Utilisation de la voix en français
            Speech.speak(actionText, {
                voiceLocale: 'fr-FR'
            });
            setInformation(actionText);
            websocketRef.current.send(JSON.stringify({ type: action }));
            setTimeout(() => {
                setLoading(false);
                // Vérifier si une barre est tombée à zéro après l'action
                if (tamagotchi.faim <= 0 || tamagotchi.bonheur <= 0 || tamagotchi.energie <= 0) {
                    setTamagotchi(prevState => ({
                        ...prevState,
                        isGameOver: true,
                    }));
                }
            }, 1000); // Simule le délai d'interaction
        }
    };

    const levelUp = () => {
        setTamagotchi(prevState => ({
            ...prevState,
            level: prevState.level + 1,
        }));
        setInformation('Votre AmiAmi a passé au niveau suivant !');
        Speech.speak('Votre AmiAmi a passé au niveau suivant !', {
            voiceLocale: 'fr-FR'
        });
        // Réinitialiser le compteur de temps après chaque niveau atteint
        setTimerCount(0);
    };

    const restartTamagotchi = async () => {
        if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
            websocketRef.current.send(JSON.stringify({ type: 'restart' }));
            setTamagotchi(initialTamagotchiState);
            setTimerCount(0);
            setInformation('Aide ton AmiAmi a survivre.');
            Speech.speak('Aide ton AmiAmi a survivre.', {
                voiceLocale: 'fr-FR'
            });
            startTimer();
            await AsyncStorage.removeItem('tamagotchiState'); // Supprimer l'état enregistré
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

    // Calculer la largeur des barres de progression en fonction de l'état actuel du Tamagotchi
    const faimWidth = (tamagotchi.faim / 100) * 200; // Largeur maximale arbitraire de 200 pour une faim à 100%
    const bonheurWidth = (tamagotchi.bonheur / 100) * 200;
    const energieWidth = (tamagotchi.energie / 100) * 200;

    // Animation pour le personnage
    const characterPosition = characterAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
    });

    return (
        <View style={styles.container}>
            <StatusBar hidden />
            <View style={styles.background} />
            <Text style={styles.header}>Bienvenue dans le Monde des AmiAmi</Text>
            <View style={styles.characterContainer}>
                <Animated.Image
                    source={require('/home/stephanedn/code/SDN33/MyCompanionAppBackend/MyCompanionApp/assets/images/tamagotchi.png')}
                    style={[styles.character, { transform: [{ translateY: characterPosition }] }]}
                    resizeMode="contain"
                />
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBarContainer}>
                    <Text style={styles.statsText}>Faim : {tamagotchi.faim} PV</Text>
                    <View style={[styles.statBar, { width: faimWidth, backgroundColor: tamagotchi.canFeed ? 'orange' : 'orange' }]} />
                </View>
                <View style={styles.statBarContainer}>
                    <Text style={styles.statsText}>Bonheur : {tamagotchi.bonheur} PV</Text>
                    <View style={[styles.statBar, { width: bonheurWidth, backgroundColor: tamagotchi.canPlay ? 'blue' : 'blue' }]} />
                </View>
                <View style={styles.statBarContainer}>
                    <Text style={styles.statsText}>Énergie : {tamagotchi.energie} PV</Text>
                    <View style={[styles.statBar, { width: energieWidth, backgroundColor: tamagotchi.canRest ? 'purple' : 'purple' }]} />
                </View>
                <Text style={styles.statsText}>Niveau de votre AmiAmi : {tamagotchi.level}</Text>
                <Text style={styles.statsText}>Temps écoulé : {timerCount} secondes</Text>
                <Text style={styles.information}>{information}</Text>
            </View>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={[styles.button, styles.restartButton]} onPress={restartTamagotchi} disabled={loading}>
                    <Text style={styles.buttonText}>Recommencer</Text>
                </TouchableOpacity>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#5b5b5b', // Couleur de fond inspirée par Gameboy
    },
    background: {
        position: 'absolute',
        backgroundColor: '#8bc34a', // Couleur d'arrière-plan inspirée par Pokemon
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
        color: '#ffffff', // Texte blanc
        textShadowColor: '#000000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    characterContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    character: {
        width: 150,
        height: 150,
        resizeMode: 'contain', // Ajustement de l'image pour éviter le flou
    },
    statsContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    statsText: {
        fontSize: 18,
        textAlign: 'center',
        marginBottom: 10,
        color: '#ffffff',
    },
    statBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        width: '100%',
        backgroundColor: '#424242', // Fond des barres de statistiques
        borderRadius: 5,
        overflow: 'hidden', // Pour s'assurer que les barres ne dépassent pas du conteneur
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
        backgroundColor: '#f44336', // Bouton de redémarrage rouge
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
        backgroundColor: '#757575', // Couleur de bouton grise
    },
    disabledButton: {
        backgroundColor: '#bdbdbd', // Couleur de bouton grise plus claire pour état désactivé
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        textAlign: 'center',
    },
    information: {
        fontSize: 18,
        color: '#ffffff',
        textAlign: 'center',
        marginTop: 10,
        textShadowColor: '#000000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});

export default Index;
