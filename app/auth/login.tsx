import { auth, db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState<{ email?: boolean; password?: boolean }>({});
    const router = useRouter();

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: "304504111914-agtms1cuo30dtdr939maloi8fjjbtm2q.apps.googleusercontent.com",
    });

    useEffect(() => {
        const handleGoogleLogin = async () => {
            if (response?.type === "success") {
                try {
                    const { id_token } = response.params;

                    const credential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, credential);
                    const user = userCredential.user;

                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (!docSnap.exists()) {
                        alert("No user record found. Please register first.");
                        return;
                    }

                    const userData = docSnap.data();

                    if (userData.status !== "approved") {
                        alert("Your account is not yet approved by the admin.");
                        return;
                    }
                    if (userData.status === "pending") {
                        alert("Your account is not yet approved by the admin.");
                        return;
                    }

                    if (userData.role === "Faculty") {
                        router.replace("/dashboard/faculty");
                    } else if (userData.role === "Teacher") {
                        router.replace("/dashboard/teacher");
                    } else if (userData.role === "Admin") {
                        router.replace("/dashboard/admin");
                    } else {
                        alert("Unknown role");
                    }

                } catch (error) {
                    console.log(error);
                    alert("Google login failed");
                }
            }
        };

        handleGoogleLogin();
    }, [response]);

    const handleLogin = async () => {
        let newErrors: { email?: boolean; password?: boolean } = {};

        if (!email) newErrors.email = true;
        if (!password) newErrors.password = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            alert("Please enter email and password");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (!docSnap.exists()) {
                alert("User record not found");
                return;
            }

            const userData = docSnap.data();

            if (userData.status !== "approved") {
                alert("Your account is not yet approved by the admin.");
                return;
            }

            if (userData.role === "Faculty") {
                router.replace("/dashboard/faculty");
            } else if (userData.role === "Teacher") {
                router.replace("/dashboard/teacher");
            } else if (userData.role === "Admin") {
                router.replace("/dashboard/admin");
            } else {
                alert("Unknown role");
            }

        } catch (error) {
            console.log(error);
            alert("Invalid email or password");
        }
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            showsVerticalScrollIndicator={false}
        >
            <Image
                source={require("../../assets/images/securikey-logo.png")}
                style={styles.logo}
            />

            <Text style={styles.subtitle}>Login to your account</Text>

            <TextInput
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                style={[styles.input, errors.email && styles.errorInput]}
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    setErrors(prev => ({ ...prev, email: false }));
                }}
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    style={[styles.input, errors.password && styles.errorInput]}
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        setErrors(prev => ({ ...prev, password: false }));
                    }}
                />

                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPassword(!showPassword)}
                >
                    <Ionicons
                        name={showPassword ? "eye" : "eye-off"}
                        size={22}
                        color="#94A3B8"
                    />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/register")}>
                <Text style={styles.registerText}>
                    Don't have an account? Register
                </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Or login using</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.socialContainer}>

                <TouchableOpacity style={styles.socialCircle}>
                    <Ionicons name="logo-facebook" size={26} color="#1877F2" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.socialCircle}
                    onPress={() => promptAsync()}
                >
                    <Ionicons name="logo-google" size={26} color="#DB4437" />
                </TouchableOpacity>

            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
        justifyContent: "center",
        paddingHorizontal: 30,
    },

    subtitle: {
        fontSize: 18,
        color: "#CBD5F5",
        textAlign: "center",
        marginBottom: 40,
    },

    input: {
        backgroundColor: "#1C1C1E",
        padding: 15,
        borderRadius: 10,
        color: "white",
        marginBottom: 15,
    },

    button: {
        backgroundColor: "#ffff00",
        padding: 15,
        borderRadius: 50,
        alignItems: "center",
        marginTop: 10,
    },

    buttonText: {
        color: "black",
        fontWeight: "bold",
        fontSize: 16,
    },

    registerText: {
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 20,
    },

    passwordContainer: {
        position: "relative",
        justifyContent: "center",
    },

    eyeButton: {
        position: "absolute",
        right: 15,
    },

    errorInput: {
        borderWidth: 2,
        borderColor: "red",
    },

    logo: {
        width: 200,
        height: 200,
        resizeMode: "contain",
        alignSelf: "center",
    },

    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 25,
    },

    line: {
        flex: 1,
        height: 1,
        backgroundColor: "#333",
    },

    dividerText: {
        color: "#9CA3AF",
        marginHorizontal: 10,
        fontSize: 14,
    },

    socialContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 20,
    },

    socialCircle: {
        width: 55,
        height: 55,
        borderRadius: 50,
        backgroundColor: "#1C1C1E",
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#333",
    },

    socialText: {
        color: "white",
        marginLeft: 8,
        fontWeight: "500",
    },
});