import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as Progress from "react-native-progress";

interface User {
    id: string;
    name: string;
    role: string;
    status: string;
}

type NotificationItem = {
    id: string;
    type: "user" | "log";
    message: string;
};

export default function AdminDashboard() {
    const [logs, setLogs] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [adminName, setAdminName] = useState("Admin User");
    const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [seenPendingCount, setSeenPendingCount] = useState(0);
    const [seenLogsCount, setSeenLogsCount] = useState(0);

    const [notifications, setNotifications] = useState(0);
    const [prevUsersCount, setPrevUsersCount] = useState(0);
    const [prevLogsCount, setPrevLogsCount] = useState(0);

    const router = useRouter();

    useEffect(() => {
        const unsubLogs = onSnapshot(collection(db, "logs"), (snapshot) => {
            const data: any[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setLogs(data);
        });

        const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
            const data: any[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });
            setUsers(data);
        });

        return () => {
            unsubLogs();
            unsubUsers();
        };
    }, []);

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        const data: User[] = [];

        snapshot.forEach((doc) => {
            const user = {
                id: doc.id,
                ...(doc.data() as Omit<User, "id">),
            };

            data.push(user);

            if (user.role === "Admin") {
                setAdminName(user.name);
            }
        });

        setUsers(data);
    });

    useEffect(() => {
        if (users.length > prevUsersCount) {
            const newUsers = users.length - prevUsersCount;

            const newPending = users.filter(u => u.status === "pending").length;

            if (newPending > 0) {
                setNotifications((prev) => prev + newPending);
            }

            setPrevUsersCount(users.length);
        }

        if (logs.length > prevLogsCount) {
            const newLogs = logs.length - prevLogsCount;

            setNotifications((prev) => prev + newLogs);
            setPrevLogsCount(logs.length);
        }
    }, [users, logs]);

    useEffect(() => {
        const newNotifs: NotificationItem[] = [];

        const pendingUsers = users.filter((u) => u.status === "pending");

        if (pendingUsers.length > seenPendingCount) {
            newNotifs.push({
                id: `pending-${Date.now()}`,
                type: "user",
                message: `${pendingUsers.length} pending user(s) need approval`,
            });

            setSeenPendingCount(pendingUsers.length);
        }

        if (todayLogs.length > seenLogsCount) {
            newNotifs.push({
                id: `logs-${Date.now()}`,
                type: "log",
                message: `${todayLogs.length} new log(s) today`,
            });

            setSeenLogsCount(todayLogs.length);
        }

        if (newNotifs.length > 0) {
            setNotificationsList((prev) => [...prev, ...newNotifs]);
        }
    }, [users, logs]);

    const today = new Date();

    const todayLogs = logs.filter((log) => {
        const d = log.timestamp?.toDate?.();
        return d &&
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear();
    });

    const monthlyLogs = logs.filter((log) => {
        const d = log.timestamp?.toDate?.();
        return d && d.getMonth() === today.getMonth();
    });

    const activeUsers = users.filter((u) => u.status === "approved");
    const pendingUsers = users.filter((u) => u.status === "pending");

    const totalUsers = users.length;
    const approvedUsersCount = activeUsers.length;
    const pendingUsersCount = pendingUsers.length;

    const totalLogs = logs.length;
    const monthlyLogsCount = monthlyLogs.length;
    const todayLogsCount = todayLogs.length;

    const teacherCount = users.filter((u) => u.role === "Teacher").length;
    const facultyCount = users.filter((u) => u.role === "Faculty").length;

    const totalUsersProgress = totalUsers ? approvedUsersCount / totalUsers : 0;
    const monthlyLogsProgress = totalLogs ? monthlyLogsCount / totalLogs : 0;
    const todayLogsProgress = totalLogs ? todayLogsCount / totalLogs : 0;
    const teacherProgress = totalUsers ? teacherCount / totalUsers : 0;
    const facultyProgress = totalUsers ? facultyCount / totalUsers : 0;

    const getWeeklyData = () => {
        const counts = Array(7).fill(0);

        logs.forEach((log) => {
            const d = log.timestamp?.toDate?.();
            if (d) {
                let day = d.getDay();

                day = day === 0 ? 6 : day - 1;

                counts[day]++;
            }
        });

        return counts;
    };

    const getInitials = (name: string) =>
        name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase();

    const handleNotificationPress = (notif: NotificationItem) => {
        setNotificationsList((prev) =>
            prev.filter((n) => n.id !== notif.id)
        );

        setShowNotifications(false);

        if (notif.type === "user") {
            router.push("/dashboard/admin/users");
        }

        if (notif.type === "log") {
            router.push("/dashboard/admin/logs?tab=today");
        }
    };

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>Welcome admin</Text>
                    <Text style={styles.dashboardText}>Dashboard</Text>
                </View>

                <View style={styles.rightSection}>
                    <TouchableOpacity
                        style={styles.iconWrapper}
                        onPress={() => setShowNotifications(!showNotifications)}
                    >
                        <Ionicons name="notifications-outline" size={24} color="#CBD5F5" />

                        {notificationsList.length > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {notificationsList.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(adminName)}</Text>
                    </View>
                </View>
            </View>

            {showNotifications && (
                <View style={styles.notificationDropdown}>
                    {notificationsList.length === 0 ? (
                        <Text style={styles.noNotifText}>No notifications</Text>
                    ) : (
                        notificationsList.map((notif) => (
                            <TouchableOpacity
                                key={notif.id}
                                style={styles.notificationItem}
                                onPress={() => handleNotificationPress(notif)}
                            >
                                <Text style={styles.notificationText}>
                                    {notif.message}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            )}

            <LinearGradient
                colors={["#FFFF99", "#FFFF00", "#CCCC00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
            >
                <Text style={styles.cardTitle}>Activities</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Active Users</Text>
                        <Text style={styles.statNumber}>{activeUsers.length}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Monthly Logs</Text>
                        <Text style={styles.statNumber}>{monthlyLogs.length}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Today's Logs</Text>
                        <Text style={styles.statNumber}>{todayLogs.length}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Pending Users</Text>
                        <Text style={styles.statNumber}>{pendingUsers.length}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Statistics</Text>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.circleRow}
                >

                    <View style={styles.circleItem}>
                        <Progress.Circle
                            size={100}
                            progress={totalUsersProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Total Users</Text>
                    </View>

                    <View style={styles.circleItem}>
                        <Progress.Circle
                            size={100}
                            progress={monthlyLogsProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Monthly Logs</Text>
                    </View>

                    <View style={styles.circleItem}>
                        <Progress.Circle
                            size={100}
                            progress={facultyProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Total Faculty</Text>
                    </View>

                    <View style={styles.circleItem}>
                        <Progress.Circle
                            size={100}
                            progress={teacherProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Total Teachers</Text>
                    </View>

                    <View style={styles.circleItem}>
                        <Progress.Circle
                            size={100}
                            progress={todayLogsProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Today's Logs</Text>
                    </View>

                </ScrollView>
            </View>

            <View style={styles.weeklyContainer}>
                <Text style={styles.weeklyTitle}>Weekly Logs</Text>

                <LineChart
                    data={{
                        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                        datasets: [
                            {
                                data: getWeeklyData(),
                            },
                        ],
                    }}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    yAxisLabel=""
                    chartConfig={{
                        backgroundColor: "#111",
                        backgroundGradientFrom: "#111",
                        backgroundGradientTo: "#111",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 213, 79, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                        propsForDots: {
                            r: "4",
                            strokeWidth: "2",
                            stroke: "#FFD54F",
                        },
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>

        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 50,
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 15,
    },

    welcomeText: {
        fontSize: 14,
        color: "#CBD5F5",
    },

    dashboardText: {
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 5,
        color: "white",
    },

    rightSection: {
        flexDirection: "row",
        alignItems: "center",
    },

    iconWrapper: {
        marginRight: 15,
    },

    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#4A90E2",
        justifyContent: "center",
        alignItems: "center",
    },

    avatarText: {
        color: "#fff",
        fontWeight: "bold",
    },

    card: {
        margin: 20,
        paddingTop: 5,
        paddingBottom: 20,
        borderRadius: 15,
        paddingHorizontal: 10,
    },

    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 10,
    },

    statBox: {
        alignItems: "center",
        flex: 1,
    },

    cardTitle: {
        color: "#000",
        fontSize: 12,
        marginBottom: 15,
    },

    statLabel: {
        color: "#333",
        fontSize: 12,
        marginHorizontal: 10,
        marginBottom: 8,
    },

    statNumber: {
        color: "#000",
        fontSize: 25,
        fontWeight: "bold",
    },

    statsContainer: {
        marginHorizontal: 20,
        marginTop: 10,
    },

    statsTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 15,
    },

    circleRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    circleItem: {
        alignItems: "center",
        marginRight: 20
    },

    circleLabel: {
        color: "#ccc",
        marginTop: 8,
        fontSize: 12,
    },

    weeklyContainer: {
        marginHorizontal: 20,
        marginTop: 20,
    },

    weeklyTitle: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
    },

    chart: {
        borderRadius: 15,
    },
    badge: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "red",
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 4,
    },

    badgeText: {
        color: "#fff",
        fontSize: 10,
        fontWeight: "bold",
    },

    notificationDropdown: {
        position: "absolute",
        top: 90,
        right: 20,
        backgroundColor: "#1C1C1E",
        borderRadius: 10,
        padding: 5,
        width: 200,
        zIndex: 999,
    },

    notificationItem: {
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#333",
    },

    notificationText: {
        color: "#fff",
        fontSize: 12,
    },

    noNotifText: {
        color: "#9CA3AF",
        textAlign: "center",
    },
});