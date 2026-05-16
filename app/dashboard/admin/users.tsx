import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { collection, doc, onSnapshot, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

type UserType = {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    status?: string;
};

export default function Users() {
    const [activeTab, setActiveTab] = useState<"active" | "pending">("active");
    const [search, setSearch] = useState("");

    const [activeUsers, setActiveUsers] = useState<UserType[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserType[]>([]);

    const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const currentUsers = activeTab === "active" ? activeUsers : pendingUsers;
    const [roleFilter, setRoleFilter] = useState<"all" | "faculty" | "teacher">("all");

    const filteredUsers = currentUsers
        .filter(user =>
            (user.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (user.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (user.role || "").toLowerCase().includes(search.toLowerCase())
        )
        .filter(user => {
            if (activeTab !== "active") return true;

            if (roleFilter === "all") return true;

            return (user.role || "").toLowerCase() === roleFilter;
        });

    const getInitials = (name?: string) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase();
    };

    useEffect(() => {
        const q = query(collection(db, "users"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const approved: any[] = [];
            const pending: any[] = [];

            snapshot.forEach((doc) => {
                const data = {
                    id: doc.id,
                    ...(doc.data() as Omit<UserType, "id">),
                };

                if (data.status === "approved") {
                    approved.push(data);
                } else if (data.status === "pending") {
                    pending.push(data);
                }
            });

            setActiveUsers(approved);
            setPendingUsers(pending);
        });

        return () => unsubscribe();
    }, []);

    const approveUser = async () => {
        if (!selectedUser) return;

        try {
            const userRef = doc(db, "users", selectedUser.id);

            await updateDoc(userRef, {
                status: "approved",
            });

            setModalVisible(false);
            setSelectedUser(null);
        } catch (error) {
            console.log("Error approving user:", error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Users</Text>
                    <Text style={styles.subtitle}>Manage your users</Text>
                </View>

                <View style={styles.searchBox}>
                    <Ionicons name="search" size={18} color="#9CA3AF" />
                    <TextInput
                        placeholder="Search..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                        style={styles.searchInput}
                    />
                </View>
            </View>

            <View style={styles.toggleContainer}>
                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        activeTab === "active" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("active")}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            activeTab === "active" && styles.activeText,
                        ]}
                    >
                        Active
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.toggleButton,
                        activeTab === "pending" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("pending")}
                >
                    <Text
                        style={[
                            styles.toggleText,
                            activeTab === "pending" && styles.activeText,
                        ]}
                    >
                        Pending
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === "active" && (
                <View style={styles.roleContainer}>
                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            roleFilter === "all" && styles.activeRole,
                        ]}
                        onPress={() => setRoleFilter("all")}
                    >
                        <Text
                            style={[
                                styles.roleText,
                                roleFilter === "all" && styles.activeRoleText,
                            ]}
                        >
                            All
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            roleFilter === "faculty" && styles.activeRole,
                        ]}
                        onPress={() => setRoleFilter("faculty")}
                    >
                        <Text
                            style={[
                                styles.roleText,
                                roleFilter === "faculty" && styles.activeRoleText,
                            ]}
                        >
                            Faculty
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.roleButton,
                            roleFilter === "teacher" && styles.activeRole,
                        ]}
                        onPress={() => setRoleFilter("teacher")}
                    >
                        <Text
                            style={[
                                styles.roleText,
                                roleFilter === "teacher" && styles.activeRoleText,
                            ]}
                        >
                            Teacher
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => {
                            if (activeTab === "pending") {
                                setSelectedUser(item);
                                setModalVisible(true);
                            }
                        }}
                    >
                        <View style={styles.card}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(item.name)}
                                </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={styles.name}>{item.name}</Text>
                                <Text style={styles.info}>{item.email}</Text>
                                <Text style={styles.role}>{item.role}</Text>

                                {activeTab === "pending" && (
                                    <Text style={styles.pendingLabel}>
                                        Pending Approval
                                    </Text>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {activeTab === "pending"
                                ? "No pending users"
                                : "No active users"}
                        </Text>
                    </View>
                )}
                contentContainerStyle={{
                    paddingBottom: 20,
                    flexGrow: 1,
                    justifyContent: filteredUsers.length === 0 ? "center" : "flex-start",
                }}
                showsVerticalScrollIndicator={false}
            />

            <Modal
                transparent
                visible={modalVisible}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalBox}>
                        <Text style={styles.modalTitle}>Approve User</Text>

                        <Text style={styles.modalText}>
                            {selectedUser?.name}
                        </Text>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.cancelBtn}
                            >
                                <Text style={{ color: "#fff" }}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={approveUser}
                                style={styles.okBtn}
                            >
                                <Text style={{ color: "#000", fontWeight: "bold" }}>
                                    OK
                                </Text>
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
        paddingTop: 60,
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },

    title: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#fff",
    },

    subtitle: {
        color: "#9CA3AF",
        marginTop: 4,
    },

    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        borderRadius: 10,
        paddingHorizontal: 10,
        width: 150,
    },

    searchInput: {
        color: "white",
        marginLeft: 5,
        flex: 1,
    },

    toggleContainer: {
        flexDirection: "row",
        backgroundColor: "#1C1C1E",
        borderRadius: 25,
        marginBottom: 20,
    },

    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
        borderRadius: 25,
    },

    activeTab: {
        backgroundColor: "#ffff00",
    },

    toggleText: {
        color: "#9CA3AF",
        fontWeight: "500",
    },

    activeText: {
        color: "#000",
        fontWeight: "bold",
    },

    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1C1C1E",
        padding: 15,
        borderRadius: 12,
        marginBottom: 12,
    },

    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: "#ffff00",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },

    avatarText: {
        color: "#000",
        fontWeight: "bold",
        fontSize: 16,
    },

    name: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },

    info: {
        color: "#9CA3AF",
        fontSize: 13,
    },

    role: {
        color: "#ffff00",
        fontSize: 12,
        marginTop: 2,
    },

    pendingLabel: {
        color: "#ff4444",
        fontSize: 12,
        marginTop: 2,
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
        borderRadius: 12,
        width: "80%",
    },

    modalTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },

    modalText: {
        color: "#9CA3AF",
        marginBottom: 20,
    },

    modalButtons: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },

    cancelBtn: {
        marginRight: 10,
        padding: 10,
    },

    okBtn: {
        backgroundColor: "#ffff00",
        padding: 10,
        borderRadius: 8,
    },

    roleContainer: {
        flexDirection: "row",
        backgroundColor: "#1C1C1E",
        borderRadius: 25,
        marginBottom: 15,
    },

    roleButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: "center",
        borderRadius: 25,
    },

    activeRole: {
        backgroundColor: "#ffff00",
    },

    roleText: {
        color: "#9CA3AF",
        fontSize: 13,
    },

    activeRoleText: {
        color: "#000",
        fontWeight: "bold",
    },

    emptyContainer: {
        alignItems: "center",
    },

    emptyText: {
        color: "#9CA3AF",
        fontSize: 16,
    },
});