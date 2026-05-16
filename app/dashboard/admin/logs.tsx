import { db } from "@/lib/firebase";
import { Ionicons } from "@expo/vector-icons";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface LogItem {
    id: string;
    name: string;
    role: string;
    action: string;
    timestamp: any;
}

const getInitials = (name: string) =>
    name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();

const isToday = (date: Date) => {
    const today = new Date();
    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

const formatDay = (date: Date) =>
    date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
    });

const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

export default function Logs() {
    const [visibleCount, setVisibleCount] = useState(5);
    const [activeTab, setActiveTab] = useState<"today" | "monthly" | "archive">("today");
    const [search, setSearch] = useState("");
    const [logs, setLogs] = useState<LogItem[]>([]);

    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    useEffect(() => {
        const q = query(collection(db, "logs"), orderBy("timestamp", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: LogItem[] = [];

            snapshot.forEach((doc) => {
                data.push({
                    id: doc.id,
                    ...(doc.data() as Omit<LogItem, "id">),
                });
            });

            setLogs(data);
        });

        return () => unsubscribe();
    }, []);

    const todayLogs = logs.filter((log) => isToday(log.timestamp.toDate()));

    const monthlyLogs = logs.filter((log) => {
        const d = log.timestamp.toDate();
        return !isToday(d) && d.getMonth() === new Date().getMonth();
    });

    const archiveLogs = logs.filter((log) => {
        const d = log.timestamp.toDate();
        return !isToday(d);
    });

    const groupByDate = (data: LogItem[]) => {
        const groups: Record<string, LogItem[]> = {};

        data.forEach((log) => {
            const key = formatDay(log.timestamp.toDate());
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });

        return Object.entries(groups);
    };

    const groupByMonth = (data: LogItem[]) => {
        const groups: Record<string, LogItem[]> = {};

        data.forEach((log) => {
            const key = formatMonth(log.timestamp.toDate());
            if (!groups[key]) groups[key] = [];
            groups[key].push(log);
        });

        return Object.entries(groups);
    };

    const renderEmpty = (text: string) => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{text}</Text>
        </View>
    );

    const renderLogItem = ({ item }: { item: LogItem }) => (
        <View style={styles.card}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>

            <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.info}>{item.role}</Text>
                <Text style={styles.action}>{item.action}</Text>
            </View>

            <Text style={styles.datetime}>
                {item.timestamp.toDate().toLocaleTimeString()}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Logs</Text>
                    <Text style={styles.subtitle}>Monitor user activity</Text>
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
                {["today", "monthly", "archive"].map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.toggleButton,
                            activeTab === tab && styles.activeTab,
                        ]}
                        onPress={() => {
                            setActiveTab(tab as any);
                            setSelectedMonth(null);
                            setSelectedDate(null);
                            setVisibleCount(5);
                        }}
                    >
                        <Text
                            style={[
                                styles.toggleText,
                                activeTab === tab && styles.activeText,
                            ]}
                        >
                            {tab === "today"
                                ? "Today's Logs"
                                : tab === "monthly"
                                    ? "Monthly Logs"
                                    : "Archive"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {(selectedMonth || selectedDate) && (
                <View style={styles.breadcrumbContainer}>
                    <TouchableOpacity
                        onPress={() => {
                            if (selectedDate) setSelectedDate(null);
                            else if (selectedMonth) setSelectedMonth(null);
                            setVisibleCount(5);
                        }}
                    >
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.breadcrumbText}>
                        {activeTab === "archive" && "Archive"}
                        {selectedMonth ? ` > ${selectedMonth}` : ""}
                        {selectedDate ? ` > ${selectedDate}` : ""}
                    </Text>
                </View>
            )}

            {activeTab === "today" && (
                <>
                    <FlatList
                        data={todayLogs.slice(0, visibleCount)}
                        keyExtractor={(item) => item.id}
                        renderItem={renderLogItem}
                        ListEmptyComponent={() => renderEmpty("No today's logs")}
                    />

                    <View style={styles.paginationContainer}>
                        {visibleCount < todayLogs.length ? (
                            <TouchableOpacity
                                style={styles.showMoreBtn}
                                onPress={() => setVisibleCount((prev) => prev + 5)}
                            >
                                <Text style={styles.showMoreText}>Show More</Text>
                            </TouchableOpacity>
                        ) : visibleCount > 5 ? (
                            <TouchableOpacity
                                style={styles.showLessBtn}
                                onPress={() => setVisibleCount(5)}
                            >
                                <Text style={styles.showLessText}>Show Less</Text>
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </>
            )}

            {activeTab === "monthly" && (
                <>
                    {!selectedDate ? (
                        <FlatList
                            data={groupByDate(monthlyLogs)}
                            keyExtractor={(item) => item[0]}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedDate(item[0]);
                                        setVisibleCount(5);
                                    }}
                                    style={styles.card}
                                >
                                    <Text style={styles.name}>{item[0]}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => renderEmpty("No logs")}
                        />
                    ) : (
                        (() => {
                            const selectedLogs =
                                groupByDate(monthlyLogs).find((g) => g[0] === selectedDate)?.[1] || [];

                            return (
                                <>
                                    <FlatList
                                        data={selectedLogs.slice(0, visibleCount)}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderLogItem}
                                        ListEmptyComponent={() => renderEmpty("No logs")}
                                    />

                                    <View style={styles.paginationContainer}>
                                        {visibleCount < selectedLogs.length ? (
                                            <TouchableOpacity
                                                style={styles.showMoreBtn}
                                                onPress={() => setVisibleCount((prev) => prev + 5)}
                                            >
                                                <Text style={styles.showMoreText}>Show More</Text>
                                            </TouchableOpacity>
                                        ) : visibleCount > 5 ? (
                                            <TouchableOpacity
                                                style={styles.showLessBtn}
                                                onPress={() => setVisibleCount(5)}
                                            >
                                                <Text style={styles.showLessText}>Show Less</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </>
                            );
                        })()
                    )}
                </>
            )}

            {activeTab === "archive" && (
                <>
                    {!selectedMonth ? (
                        <FlatList
                            data={groupByMonth(archiveLogs)}
                            keyExtractor={(item) => item[0]}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedMonth(item[0]);
                                        setVisibleCount(5);
                                    }}
                                    style={styles.card}
                                >
                                    <Text style={styles.name}>{item[0]}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => renderEmpty("No logs")}
                        />
                    ) : !selectedDate ? (
                        <FlatList
                            data={groupByDate(
                                groupByMonth(archiveLogs).find((g) => g[0] === selectedMonth)?.[1] || []
                            )}
                            keyExtractor={(item) => item[0]}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSelectedDate(item[0]);
                                        setVisibleCount(5);
                                    }}
                                    style={styles.card}
                                >
                                    <Text style={styles.name}>{item[0]}</Text>
                                </TouchableOpacity>
                            )}
                            ListEmptyComponent={() => renderEmpty("No logs")}
                        />
                    ) : (
                        (() => {
                            const selectedLogs =
                                groupByDate(
                                    groupByMonth(archiveLogs).find((g) => g[0] === selectedMonth)?.[1] || []
                                ).find((g) => g[0] === selectedDate)?.[1] || [];

                            return (
                                <>
                                    <FlatList
                                        data={selectedLogs.slice(0, visibleCount)}
                                        keyExtractor={(item) => item.id}
                                        renderItem={renderLogItem}
                                        ListEmptyComponent={() => renderEmpty("No logs")}
                                    />

                                    <View style={styles.paginationContainer}>
                                        {visibleCount < selectedLogs.length ? (
                                            <TouchableOpacity
                                                style={styles.showMoreBtn}
                                                onPress={() => setVisibleCount((prev) => prev + 5)}
                                            >
                                                <Text style={styles.showMoreText}>Show More</Text>
                                            </TouchableOpacity>
                                        ) : visibleCount > 5 ? (
                                            <TouchableOpacity
                                                style={styles.showLessBtn}
                                                onPress={() => setVisibleCount(5)}
                                            >
                                                <Text style={styles.showLessText}>Show Less</Text>
                                            </TouchableOpacity>
                                        ) : null}
                                    </View>
                                </>
                            );
                        })()
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    breadcrumbContainer: {
        marginBottom: 10,
    },
    backText: {
        color: "#ffff00",
        marginBottom: 4,
        fontWeight: "600",
    },
    breadcrumbText: {
        color: "#9CA3AF",
        fontSize: 12,
    },
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
        fontSize: 12,
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
        fontSize: 12,
    },
    action: {
        color: "#ffff00",
        fontSize: 12,
    },
    datetime: {
        color: "#9CA3AF",
        fontSize: 11,
    },
    emptyContainer: {
        alignItems: "center",
        marginTop: 40,
    },
    emptyText: {
        color: "#9CA3AF",
        fontSize: 16,
    },
    showMoreBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    showMoreText: {
        color: "#ffff00",
        fontWeight: "600",
    },
    paginationContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 10,
    },
    showLessBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    showLessText: {
        color: "#9CA3AF",
        fontWeight: "600",
    },
});