import { auth, db } from "@/lib/firebase";
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Google from "expo-auth-session/providers/google";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

type FormErrors = {
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    rfidCardId?: boolean;
};

export default function RegisterScreen() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState("Faculty");
    const [rfidCardId, setRfidCardId] = useState("");
    const [errors, setErrors] = useState<FormErrors>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const router = useRouter();

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: "304504111914-agtms1cuo30dtdr939maloi8fjjbtm2q.apps.googleusercontent.com",
        scopes: ["profile", "email"],
    });

    useEffect(() => {
        const handleGoogleRegister = async () => {
            if (response?.type === "success") {
                try {
                    const { id_token } = response.params;

                    const credential = GoogleAuthProvider.credential(id_token);
                    const userCredential = await signInWithCredential(auth, credential);
                    const user = userCredential.user;

                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (!docSnap.exists()) {
                        await setDoc(doc(db, "users", user.uid), {
                            name: user.displayName || "Google User",
                            email: user.email,
                            role: "Faculty",
                            rfidCardId: "",
                        });
                    }

                    router.replace("/dashboard/faculty");

                } catch (error) {
                    console.log(error);
                    alert("Google registration failed");
                }
            }
        };

        handleGoogleRegister();
    }, [response]);

    const handleRegister = async () => {
        let newErrors: FormErrors = {};
        if (!name) newErrors.name = true;
        if (!email) newErrors.email = true;
        if (!password) newErrors.password = true;
        if (!confirmPassword) newErrors.confirmPassword = true;
        if (!rfidCardId) newErrors.rfidCardId = true;

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            alert("Please fill all fields");
            return;
        }

        setErrors({});

        if (password.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name: name,
                email: email,
                role: role,
                rfidCardId: rfidCardId,
                status: "pending",
                createdAt: new Date()
            });

            setShowModal(true);

        } catch (error) {
            console.log(error);
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

            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Register to start using SecuriKey</Text>

            <TextInput
                placeholder="Full Name"
                placeholderTextColor="#94A3B8"
                style={[styles.input, errors.name && styles.errorInput]}
                onChangeText={setName}
            />

            <TextInput
                placeholder="Email"
                placeholderTextColor="#94A3B8"
                style={[styles.input, errors.email && styles.errorInput]}
                onChangeText={setEmail}
            />

            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showPassword}
                    style={[styles.input, errors.password && styles.errorInput]}
                    onChangeText={setPassword}
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

            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="Confirm Password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry={!showConfirmPassword}
                    style={[styles.input, errors.confirmPassword && styles.errorInput]}
                    onChangeText={setConfirmPassword}
                />

                <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                    <Ionicons
                        name={showConfirmPassword ? "eye" : "eye-off"}
                        size={22}
                        color="#94A3B8"
                    />
                </TouchableOpacity>
            </View>

            <TextInput
                placeholder="RFID Card ID"
                placeholderTextColor="#94A3B8"
                style={[styles.input, errors.rfidCardId && styles.errorInput]}
                onChangeText={setRfidCardId}
            />

            <Text style={styles.roleLabel}>Select Role</Text>

            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={role}
                    onValueChange={(itemValue) => setRole(itemValue)}
                    dropdownIconColor="white"
                    style={styles.picker}
                >
                    <Picker.Item label="Faculty" value="Faculty" />
                    <Picker.Item label="Teacher" value="Teacher" />
                </Picker>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleRegister}
            >
                <Text style={styles.buttonText}>Register</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={styles.loginText}>
                    Already have an account? Login
                </Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>Or register using</Text>
                <View style={styles.line} />
            </View>

            <View style={styles.socialContainer}>

                <TouchableOpacity style={styles.socialCircle}>
                    <Ionicons name="logo-facebook" size={26} color="#1877F2" />
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.socialCircle}
                    disabled={!request}
                    onPress={() => promptAsync()}
                >
                    <Ionicons name="logo-google" size={26} color="#DB4437" />
                </TouchableOpacity>

            </View>

            <Modal
                visible={showModal}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Account Pending</Text>

                        <Text style={styles.modalText}>
                            Your account is pending admin approval.
                            {"\n\n"}
                            Please consult your admin to activate your account.
                        </Text>

                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                setShowModal(false);
                                router.replace("/auth/login");
                            }}
                        >
                            <Text style={styles.modalButtonText}>OK</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: "#000000",
        paddingHorizontal: 30,
        paddingBottom: 40,
    },

    title: {
        fontSize: 25,
        fontWeight: "bold",
        color: "white",
        textAlign: "center",
        marginBottom: 10,
    },

    subtitle: {
        fontSize: 16,
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

    loginText: {
        color: "#9CA3AF",
        textAlign: "center",
        marginTop: 20,
    },

    roleLabel: {
        color: "white",
        marginBottom: 5,
    },

    pickerContainer: {
        backgroundColor: "#1C1C1E",
        borderRadius: 10,
        marginBottom: 15,
    },

    picker: {
        color: "white",
    },

    errorInput: {
        borderWidth: 2,
        borderColor: "red",
    },

    passwordContainer: {
        position: "relative",
        justifyContent: "center",
    },

    eyeButton: {
        position: "absolute",
        right: 15,
    },

    logo: {
        width: 90,
        height: 90,
        resizeMode: "contain",
        alignSelf: "center",
        marginTop: 35,
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

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalContainer: {
        width: "85%",
        backgroundColor: "#1C1C1E",
        borderRadius: 15,
        padding: 25,
        alignItems: "center",
    },

    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "white",
        marginBottom: 10,
    },

    modalText: {
        color: "#CBD5F5",
        textAlign: "center",
        marginBottom: 20,
    },

    modalButton: {
        backgroundColor: "#ffff00",
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 25,
    },

    modalButtonText: {
        color: "black",
        fontWeight: "bold",
    },
});