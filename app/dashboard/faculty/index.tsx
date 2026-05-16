import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as Progress from "react-native-progress";

type NotificationItem = {
    id: string;
    message: string;
};

export default function FacultyDashboard() {
    const [logs, setLogs] = useState<any[]>([]);

    const [facultyName, setFacultyName] = useState("Faculty");
    const [rfid, setRfid] = useState<string | null>(null);

    const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [seenLogsCount, setSeenLogsCount] = useState(0);
    const [hasNotifiedApproval, setHasNotifiedApproval] = useState(false);
    const [isApprovalLoaded, setIsApprovalLoaded] = useState(false);

    useEffect(() => {
        if (!isApprovalLoaded) return;

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser?.email) return;

        const key = `seenApproval_${currentUser.email}`;

        const q = query(
            collection(db, "users"),
            where("email", "==", currentUser.email)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.forEach((doc) => {
                const data = doc.data();
                setFacultyName(data.name);
                setRfid(data.rfidCardId);

                if (data.status === "approved" && !hasNotifiedApproval) {
                    setNotificationsList((prev) => [
                        {
                            id: "approved",
                            message: "Your account has been approved ✅",
                        },
                        ...prev,
                    ]);

                    setHasNotifiedApproval(true);

                    AsyncStorage.setItem(key, "true");
                }
            });
        });

        return () => unsubscribe();
    }, [isApprovalLoaded]); 

    useEffect(() => {
        const loadApproval = async () => {
            const auth = getAuth();
            const currentUser = auth.currentUser;

            if (!currentUser?.email) return;

            const key = `seenApproval_${currentUser.email}`;
            const seen = await AsyncStorage.getItem(key);

            if (seen === "true") {
                setHasNotifiedApproval(true);
            }

            setIsApprovalLoaded(true);
        };

        loadApproval();
    }, []);

    useEffect(() => {
        if (!rfid) return;

        const q = query(
            collection(db, "logs"),
            where("uid", "==", rfid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: any[] = [];

            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() });
            });

            setLogs(data);
        });

        return () => unsubscribe();
    }, [rfid]);

    const today = new Date();

    const todayLogs = logs.filter((log) => {
        const d = log.timestamp?.toDate?.();
        return (
            d &&
            d.getDate() === today.getDate() &&
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
        );
    });

    useEffect(() => {
        if (todayLogs.length > seenLogsCount) {
            const newLogs = todayLogs.length - seenLogsCount;

            const newNotif: NotificationItem = {
                id: Date.now().toString(),
                message: `You have ${newLogs} new log(s)`
            };

            setNotificationsList((prev) => [newNotif, ...prev]);
            setSeenLogsCount(todayLogs.length);
        }
    }, [todayLogs]);

    const monthlyLogs = logs.filter((log) => {
        const d = log.timestamp?.toDate?.();
        return d && d.getMonth() === today.getMonth();
    });

    const totalLogs = logs.length;

    const todayLogsProgress = totalLogs ? todayLogs.length / totalLogs : 0;
    const monthlyLogsProgress = totalLogs ? monthlyLogs.length / totalLogs : 0;

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

    return (
        <View style={styles.container}>

            <View style={styles.header}>
                <View>
                    <Text style={styles.welcomeText}>
                        Welcome {facultyName}
                    </Text>
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
                        <Text style={styles.avatarText}>
                            {getInitials(facultyName)}
                        </Text>
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
                                onPress={() => {
                                    setNotificationsList((prev) =>
                                        prev.filter((n) => n.id !== notif.id)
                                    );
                                }}
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
                <Text style={styles.cardTitle}>Activity Overview</Text>

                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Logs</Text>
                        <Text style={styles.statNumber}>{totalLogs}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Monthly Logs</Text>
                        <Text style={styles.statNumber}>{monthlyLogs.length}</Text>
                    </View>

                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Today's Logs</Text>
                        <Text style={styles.statNumber}>{todayLogs.length}</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* STATISTICS */}
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
                            progress={todayLogsProgress}
                            showsText
                            color="#ffff00"
                            thickness={8}
                        />
                        <Text style={styles.circleLabel}>Today's Logs</Text>
                    </View>
                </ScrollView>
            </View>

            {/* WEEKLY CHART */}
            <View style={styles.weeklyContainer}>
                <Text style={styles.weeklyTitle}>Weekly Logs</Text>

                <LineChart
                    data={{
                        labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
                        datasets: [{ data: getWeeklyData() }],
                    }}
                    width={Dimensions.get("window").width - 40}
                    height={220}
                    chartConfig={{
                        backgroundColor: "#111",
                        backgroundGradientFrom: "#111",
                        backgroundGradientTo: "#111",
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(255, 213, 79, ${opacity})`,
                        labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    bezier
                    style={styles.chart}
                />
            </View>

        </View>
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
        padding: 15,
        borderRadius: 15,
    },
    statsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    statBox: {
        alignItems: "center",
        flex: 1,
    },
    statLabel: {
        color: "#333",
        fontSize: 12,
    },
    statNumber: {
        color: "#000",
        fontSize: 22,
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
    },
    circleItem: {
        alignItems: "center",
        marginRight: 20,
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
    cardTitle: {
        color: "#000",
        fontSize: 12,
        marginBottom: 15,
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
        fontSize: 11,
    },

    noNotifText: {
        color: "#9CA3AF",
        textAlign: "center",
    },
});