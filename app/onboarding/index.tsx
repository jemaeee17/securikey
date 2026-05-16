import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function OnboardingScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>

            <Image
                source={require("../../assets/images/securikey-logo.png")}
                style={styles.logo}
            />

            <Text style={styles.desc}>
                Secure Access. Smart Monitoring
            </Text>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push("/onboarding/OnboardingScreen2")}
            >
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>

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

    logo: {
        width: 200,
        height: 200,
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
});