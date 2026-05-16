import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut, updateEmail, updatePassword } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function Profile() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);

    const [user, setUser] = useState<{
        name: string;
        email: string;
        role: string;
        image?: string | null;
    } | null>(null);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        setName(data.name || "");
                        setRole(data.role || "");
                        setEmail(currentUser.email || "");

                        setUser({
                            name: data.name || "",
                            email: currentUser.email || "",
                            role: data.role || "",
                            image: data.image || null,
                        });
                    }
                } catch (error) {
                    console.log(error);
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase();
    };

    const handleSave = async () => {
        const currentUser = auth.currentUser;

        if (!currentUser) return;

        try {
            const docRef = doc(db, "users", currentUser.uid);
            await updateDoc(docRef, {
                name,
                role,
            });

            if (email !== currentUser.email) {
                await updateEmail(currentUser, email);
            }

            if (newPassword) {
                await updatePassword(currentUser, newPassword);
            }

            alert("Profile updated successfully!");
            setNewPassword("");

        } catch (error: any) {
            console.log(error);
            alert(error.message);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setModalVisible(false);
            router.replace("/auth/login");
        } catch (error) {
            console.log("Logout error:", error);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#ffff00" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.imageContainer}>
                {user?.image ? (
                    <Image source={{ uri: user.image }} style={styles.image} />
                ) : (
                    <View style={styles.initialsCircle}>
                        <Text style={styles.initialsText}>
                            {user ? getInitials(user.name) : ""}
                        </Text>
                    </View>
                )}
            </View>

            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Name"
                placeholderTextColor="#9CA3AF"
            />

            <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
            />

            <TextInput
                style={styles.input}
                value={role}
                editable={false}
            />

            <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="New Password"
                placeholderTextColor="#9CA3AF"
                secureTextEntry
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>

            <Modal transparent visible={modalVisible} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalText}>
                            Are you sure you want to logout?
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.cancelBtn}
                            >
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleLogout}
                                style={styles.okBtn}
                            >
                                <Text style={styles.okText}>OK</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
        marginBottom: 30,
    },

    imageContainer: {
        marginBottom: 20,
    },

    image: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },

    initialsCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "#ffff00",
        justifyContent: "center",
        alignItems: "center",
    },

    initialsText: {
        fontSize: 36,
        fontWeight: "bold",
        color: "#000",
    },

    name: {
        fontSize: 20,
        color: "#fff",
        fontWeight: "600",
        marginBottom: 5,
    },

    info: {
        fontSize: 14,
        color: "#9CA3AF",
        marginBottom: 5,
    },

    changePassword: {
        color: "#ffff00",
        marginTop: 15,
        marginBottom: 30,
        fontWeight: "500",
    },

    logoutButton: {
        backgroundColor: "#ff4444",
        paddingVertical: 15,
        paddingHorizontal: 90,
        borderRadius: 25,
    },

    logoutText: {
        color: "#fff",
        fontWeight: "bold",
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },

    modalBox: {
        backgroundColor: "#1C1C1E",
        padding: 20,
        borderRadius: 10,
        width: "80%",
    },

    modalText: {
        color: "#fff",
        fontSize: 16,
        marginBottom: 20,
        textAlign: "center",
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
    },

    cancelBtn: {
        padding: 10,
    },

    cancelText: {
        color: "#9CA3AF",
    },

    okBtn: {
        padding: 10,
    },

    okText: {
        color: "#ffff00",
        fontWeight: "bold",
    },

    input: {
        backgroundColor: "#1C1C1E",
        padding: 15,
        borderRadius: 10,
        color: "white",
        marginBottom: 12,
        width: "100%",
    },

    saveButton: {
        backgroundColor: "#ffff00",
        padding: 15,
        borderRadius: 25,
        marginTop: 10,
        marginBottom: 10,
        width: "70%",
        alignItems: "center",
    },

    saveText: {
        color: "#000",
        fontWeight: "bold",
    },
});