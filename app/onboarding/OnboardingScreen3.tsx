import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen3() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.skipButton}
                onPress={() => router.replace("/auth/login")}
            >
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>

            <Image
                source={require("../../assets/images/screen3.png")}
                style={styles.image}
            />

            <Text style={styles.title}>Monitor Activity Easily</Text>

            <Text style={styles.desc}>
                View real-time logs of personnels entering the computer room and manage
                access securely.
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.replace("/auth/login")}
            >
                <Text style={styles.buttonText}>Get Started</Text>
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
    },

    image: {
        width: 200,
        height: 200,
        marginBottom: 40,
    },

    title: {
        fontSize: 25,
        fontWeight: "bold",
        color: "white",
        marginBottom: 15,
    },

    desc: {
        fontSize: 18,
        color: "white",
        textAlign: "center",
        marginBottom: 60,
    },

    button: {
        backgroundColor: "#ffff00",
        paddingVertical: 14,
        paddingHorizontal: 70,
        borderRadius: 50,
    },

    buttonText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "black",
    },


    skipButton: {
        position: "absolute",
        top: 60,
        right: 30,
    },

    skipText: {
        color: "white",
        fontSize: 16,
    },

    dotsContainer: {
        flexDirection: "row",
        marginTop: 25,
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: "#555",
        marginHorizontal: 5,
    },

    activeDot: {
        backgroundColor: "#ffff00",
    },
});