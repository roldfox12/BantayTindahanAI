import { View, Text, FlatList, Button, TextInput, Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, Modal, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker'; // Keep for compatibility if needed elsewhere
import { MaterialIcons } from '@expo/vector-icons';

// Firebase imports
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, deleteDoc, updateDoc, onSnapshot, initializeFirestore, persistentLocalCache, disableNetwork, enableNetwork } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// --- Configuration and Initialization (Keep these at the top) ---

// Your Firebase config (use your real values)
const firebaseConfig = {
    apiKey: "AIzaSyA8KG-9g053c3FZtGfM9jCaib3lBTATROk",
    authDomain: "bantaytindahanai.firebaseapp.com",
    projectId: "bantaytindahanai",
    storageBucket: "bantaytindahanai.firebasestorage.app",
    messagingSenderId: "630138740042",
    appId: "1:630138740042:web:c4da12d7f296d18b9fb5b3",
    measurementId: "G-SH8R01292D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Enable Offline Persistence
const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});
const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// --- Helper Functions (Keep these here) ---

// Log sale to Firestore (per user)
const logSaleToCloud = async (userId, itemId, qty) => {
    try {
        await addDoc(collection(db, 'users', userId, 'sales'), {
            itemId,
            qty,
            date: new Date().toISOString(),
        });
    } catch (e) {
        console.error("Error logging sale: ", e);
    }
};

// Add this helper to group sales by date
const getSalesHistory = (salesData) => {
    const daily = {};
    salesData.forEach((sale) => {
        const date = sale.date?.slice(0, 10); // YYYY-MM-DD
        if (!date) return;
        daily[date] = (daily[date] || 0) + sale.qty;
    });
    // Sort by date and limit to last 7 days for a clear chart
    const sorted = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
    const last7Days = sorted.slice(-7);

    return {
        labels: last7Days.map(([date]) => date.slice(5)), // MM-DD
        data: last7Days.map(([, qty]) => qty),
    };
};

// Fetch analytics from Firestore (per user)
const fetchAnalyticsFromCloud = async (userId, setAnalytics, setSalesHistory, setProfitHistory) => {
    try {
        const salesSnap = await getDocs(collection(db, 'users', userId, 'sales'));
        const salesData = salesSnap.docs.map(doc => doc.data());
        const salesCount = {};
        salesData.forEach((sale) => {
            salesCount[sale.itemId] = (salesCount[sale.itemId] || 0) + sale.qty;
        });

        // Fetch item names and stocks for mapping and AI
        const itemsSnap = await getDocs(collection(db, 'users', userId, 'items'));
        const itemsMap = {};
        itemsSnap.docs.forEach(doc => {
            const data = doc.data();
            // Emulate Price/Cost if missing for the pitch demo
            // Default: Price ~25, Cost ~15 if not set
            itemsMap[doc.id] = { 
                name: data.name, 
                stock: data.stock,
                price: data.price ? Number(data.price) : 25,
                cost: data.cost ? Number(data.cost) : 15,
                supplier: data.supplier || 'Unknown',
                expiryDate: data.expiryDate || ''
            };
        });

        let mostSold = '';
        let leastSold = '';
        let max = -Infinity, min = Infinity;
        Object.entries(salesCount).forEach(([id, count]) => {
            if (itemsMap[id]) {
                if (count > max) { max = count; mostSold = id; }
                if (count < min) { min = count; leastSold = id; }
            }
        });

        const lowStock = Object.entries(itemsMap)
            .filter(([id, item]) => item.stock <= 5)
            .map(([id, item]) => item.name);

        const totalSales = Object.values(salesCount).reduce((a, b) => a + b, 0);

        const avgSalesPerProduct = Object.keys(itemsMap).length > 0
            ? (totalSales / Object.keys(itemsMap).length).toFixed(2)
            : "0";

        const neverSold = Object.entries(itemsMap)
            .filter(([id]) => !salesCount[id])
            .map(([id, item]) => item.name);

        const top3 = Object.entries(salesCount)
            .sort((a, b) => b[1] - a[1])
            .filter(([id]) => itemsMap[id]) // Filter out deleted items so only named products appear
            .slice(0, 3)
            .map(([id]) => itemsMap[id].name);

        const least3 = Object.entries(salesCount)
            .sort((a, b) => a[1] - b[1])
            .filter(([id]) => itemsMap[id]?.stock > 0) // Only consider stocked items
            .slice(0, 3)
            .map(([id]) => itemsMap[id]?.name || id);

        // NEW: Prepare Sales Distribution for Pie Chart
        const chartColors = ['#228B22', '#20B2AA', '#FFD700', '#FF6347', '#9370DB'];
        const salesDistribution = Object.entries(salesCount)
            .sort((a, b) => b[1] - a[1])
            .filter(([id]) => itemsMap[id])
            .slice(0, 5)
            .map(([id, count], index) => ({
                name: itemsMap[id].name,
                population: count,
                color: chartColors[index % chartColors.length],
                legendFontColor: "#555",
                legendFontSize: 11
            }));

        // Demand Forecasting (Simple Moving Average over 7 days)
        const now = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);

        const recentSales = salesData.filter(sale => {
            return sale.date && new Date(sale.date) >= sevenDaysAgo;
        });

        const recentSalesMap = {};
        recentSales.forEach(sale => {
            recentSalesMap[sale.itemId] = (recentSalesMap[sale.itemId] || 0) + sale.qty;
        });

        const forecasts = [];
        Object.entries(itemsMap).forEach(([id, item]) => {
            const sold7Days = recentSalesMap[id] || 0;
            if (sold7Days > 0 && item.stock > 0) {
                const dailyRate = sold7Days / 7;
                const daysLeft = item.stock / dailyRate;
                if (daysLeft < 7) {
                    forecasts.push(`${item.name} (~${Math.ceil(daysLeft)} days)`);
                }
            }
        });

        // Financial Calculation (Real Data)
        let totalRevenue = 0;
        let totalCOGS = 0; // Cost of Goods Sold

        Object.entries(salesCount).forEach(([id, count]) => {
            const item = itemsMap[id];
            if (item) {
                totalRevenue += count * item.price;
                totalCOGS += count * item.cost;
            }
        });

        // Fetch Operational Expenses
        const expensesSnap = await getDocs(collection(db, 'users', userId, 'expenses'));
        const expenseList = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        expenseList.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date (newest first)
        const totalOperationalExpenses = expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

        const totalExpenses = totalCOGS + totalOperationalExpenses;
        const netProfit = totalRevenue - totalExpenses;

        // Calculate Daily Profit History
        const dailyProfit = {};
        
        // 1. Add Gross Profit from Sales
        salesData.forEach(sale => {
            const date = sale.date?.slice(0, 10);
            if (!date) return;
            const item = itemsMap[sale.itemId];
            if (item) {
                const profit = (item.price - item.cost) * sale.qty;
                dailyProfit[date] = (dailyProfit[date] || 0) + profit;
            }
        });

        // 2. Subtract Expenses
        expenseList.forEach(exp => {
            const date = exp.date?.slice(0, 10);
            if (!date) return;
            dailyProfit[date] = (dailyProfit[date] || 0) - (Number(exp.amount) || 0);
        });

        const sortedProfitDates = Object.keys(dailyProfit).sort();
        const last7ProfitDates = sortedProfitDates.slice(-7);
        const profitChartData = {
            labels: last7ProfitDates.map(d => d.slice(5)),
            data: last7ProfitDates.map(d => dailyProfit[d]),
        };

        // Smart Restock Suggestions
        const restockSuggestions = [];
        Object.entries(itemsMap).forEach(([id, item]) => {
            if (item.stock <= 5) {
                const weeklySales = recentSalesMap[id] || 0;
                // Suggest buying 2 weeks worth or at least 15 units
                const target = Math.max(weeklySales * 2, 15); 
                const toBuy = Math.ceil(target - item.stock);
                restockSuggestions.push(`• ${item.name} (Supplier: ${item.supplier}): Buy ~${toBuy} units`);
            }
        });

        let suggestions = [];
        if (restockSuggestions.length > 0) {
            suggestions.push(`🚚 **Restock Plan:**\n${restockSuggestions.join('\n')}`);
        }
        if (forecasts.length > 0) {
            suggestions.push(`🔮 **Demand Forecast:** Likely to run out soon: ${forecasts.join(', ')}.`);
        }
        if (mostSold && itemsMap[mostSold]) {
            suggestions.push(`📈 **Fast Mover:** Increase stock for ${itemsMap[mostSold].name}.`);
        }
        if (leastSold && itemsMap[leastSold] && salesCount[leastSold] > 0) {
            suggestions.push(`📉 **Slow Mover:** Consider promos/discount on ${itemsMap[leastSold].name}.`);
        }
        if (neverSold.length > 0) {
            suggestions.push(`🗑️ **Check Inventory:** These items have not sold: ${neverSold.join(', ')}.`);
        }
        if (suggestions.length === 0) {
             suggestions.push("✅ **Inventory looks healthy!** Keep tracking your sales.");
        }
        if (netProfit > 0) {
            suggestions.push(`💰 **Profit Trend:** You are making a ~${((netProfit/totalRevenue)*100).toFixed(0)}% margin.`);
        }

        setAnalytics({
            mostSold: mostSold ? (itemsMap[mostSold]?.name || mostSold) : 'N/A',
            leastSold: leastSold ? (itemsMap[leastSold]?.name || leastSold) : 'N/A',
            lowStock,
            suggestions: suggestions.join('\n'),
            totalSales,
            avgSalesPerProduct,
            neverSold,
            top3,
            least3,
            totalRevenue: totalRevenue.toFixed(2),
            totalExpenses: totalExpenses.toFixed(2),
            netProfit: netProfit.toFixed(2),
            totalOperationalExpenses: totalOperationalExpenses.toFixed(2),
            expenseList, // Pass the list to the UI
            salesByItem: salesCount, // Expose per-item sales for details view
            restockSuggestions, // Expose detailed restock plan
            forecasts, // Expose forecasts for Chat/Settings
            salesDistribution, // For Pie Chart
        });

        if (setSalesHistory) {
            setSalesHistory(getSalesHistory(salesData));
        }

        if (setProfitHistory) {
            setProfitHistory(profitChartData);
        }
    } catch (e) {
        console.error("Error fetching analytics: ", e);
    }
};

// Save or update an item in Firestore
const saveItemToCloud = async (userId, item) => {
    try {
        // Ensure stock is a number
        const itemToSave = { ...item, stock: Number(item.stock) };
        await setDoc(doc(db, 'users', userId, 'items', item.id), itemToSave);
    } catch (e) {
        console.error("Error saving item: ", e);
    }
};

// Update item details (Price, Supplier) in Firestore
const updateItemDetailsInCloud = async (userId, itemId, updates) => {
    try {
        await updateDoc(doc(db, 'users', userId, 'items', itemId), updates);
    } catch (e) {
        console.error("Error updating item details: ", e);
    }
};

// Delete an item from Firestore
const deleteItemFromCloud = async (userId, itemId) => {
    try {
        await deleteDoc(doc(db, 'users', userId, 'items', itemId));
    } catch (e) {
        console.error("Error deleting item: ", e);
    }
};

// Delete duplicate products from Firestore (Cleanup utility)
const deleteDuplicateProducts = async (userId, items) => {
    const seen = new Set();
    const duplicates = [];
    
    for (const item of items) {
        const normalizedName = item.name.trim().toLowerCase();
        if (seen.has(normalizedName)) {
            duplicates.push(item);
        } else {
            seen.add(normalizedName);
        }
    }

    if (duplicates.length > 0) {
        await Promise.all(duplicates.map(dup => deleteDoc(doc(db, 'users', userId, 'items', dup.id))));
        return true;
    }
    return false;
};

// --- Stylesheet (Clean, modern look) ---

const colors = {
    primary: '#228B22', // Forest Green - Brand
    accent: '#007bff',  // Blue - Save/Add
    danger: '#dc3545',  // Red - Sell/Delete
    background: '#f8f8f8',
    card: '#fff',
    text: '#333',
    lowStock: '#ffc107', // Yellow/Warning
};

const darkColors = {
    primary: '#66bb6a', // Lighter Green for dark mode
    accent: '#42a5f5',  // Lighter Blue
    danger: '#ef5350',  // Lighter Red
    background: '#121212',
    card: '#1e1e1e',
    text: '#e0e0e0',
    lowStock: '#ffd54f',
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: 40,
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.background,
    },
    authCard: {
        width: '100%',
        maxWidth: 340,
        padding: 25,
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        alignItems: 'center',
    },
    authTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 5,
    },
    authSubtitle: {
        fontSize: 14,
        color: '#888',
        marginBottom: 30,
    },
    authInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        height: 50,
        backgroundColor: '#f9f9f9',
        width: '100%',
    },
    authButton: {
        width: '100%',
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 45,
        backgroundColor: colors.card,
        fontSize: 16,
        color: colors.text,
    },
    shadowInputWrapper: {
        position: 'relative',
        marginBottom: 15,
        width: '80%',
        maxWidth: 300,
    },
    shadowLabel: {
        position: 'absolute',
        left: 14,
        top: 12,
        color: '#bbb',
        fontSize: 14,
        zIndex: 1,
    },
    authButtonRow: {
        flexDirection: 'row',
        marginTop: 10,
    },
    header: {
        paddingHorizontal: 20,
        paddingBottom: 10,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: colors.primary,
        marginBottom: 5,
    },
    tabBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#888',
    },
    tabTextActive: {
        color: colors.primary,
        borderBottomWidth: 3,
        borderBottomColor: colors.primary,
    },
    // Product Card Styles
    productCard: {
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 16,
        backgroundColor: colors.card,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f0f0f0',
    },
    productName: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    stockInput: {
        borderWidth: 1,
        borderColor: '#eee',
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        paddingHorizontal: 10,
        width: 70,
        height: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 16,
        color: '#333',
    },
    actionButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '85%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: colors.primary,
        textAlign: 'center',
    },
    statsContainer: {
        marginVertical: 15,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    },
    // Offline Banner
    offlineBanner: {
        backgroundColor: '#333',
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    // Uniform Section Styles
    sectionCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1.5,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // Chat Styles
    chatContainer: {
        flex: 1,
        padding: 10,
    },
    chatBubble: (isAi) => ({
        alignSelf: isAi ? 'flex-start' : 'flex-end',
        backgroundColor: isAi ? '#e9f7e9' : colors.accent,
        padding: 12,
        borderRadius: 15,
        borderBottomLeftRadius: isAi ? 0 : 15,
        borderBottomRightRadius: isAi ? 15 : 0,
        marginBottom: 10,
        maxWidth: '80%',
    }),
    chatText: (isAi) => ({
        color: isAi ? '#333' : '#fff',
    }),
});

// --- Component Implementations ---

// 1. Auth Screen
const AuthScreen = ({ email, setEmail, password, setPassword, authMode, setAuthMode, handleLogin, handleRegister, theme }) => {
    return (
        <View style={[styles.authContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.authCard, { backgroundColor: theme.card }]}>
                <View style={{ marginBottom: 20, backgroundColor: colors.primary + '15', padding: 15, borderRadius: 50 }}>
                    <MaterialIcons name="storefront" size={40} color={colors.primary} />
                </View>
                
                <Text style={styles.authTitle}>BantayTindahan AI</Text>
                <Text style={styles.authSubtitle}>
                    {authMode === 'login' ? 'Welcome back, Entrepreneur!' : 'Start your smart store journey'}
                </Text>

                <View style={styles.authInputContainer}>
                    <MaterialIcons name="email" size={20} color="#aaa" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={{ flex: 1, color: theme.text }}
                        placeholderTextColor="#aaa"
                    />
                </View>

                <View style={styles.authInputContainer}>
                    <MaterialIcons name="lock" size={20} color="#aaa" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        style={{ flex: 1, color: theme.text }}
                        placeholderTextColor="#aaa"
                    />
                </View>

                <TouchableOpacity 
                    style={styles.authButton} 
                    onPress={authMode === 'login' ? handleLogin : handleRegister}
                >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
                        {authMode === 'login' ? "Login" : "Create Account"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    style={{ marginTop: 20 }}
                >
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>
                        {authMode === 'login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 2. Product Card Component for FlatList
const ProductCard = ({ item, editStocks, pendingChanges, handleStockChange, saveStock, sellItem, addItem, deleteProduct, onOpenDetails, theme }) => {
    const pending = pendingChanges[item.id] ?? 0;
    const displayStock = (item.stock || 0) + pending;
    const isLowStock = displayStock <= 5;

    return (
        <View style={[styles.productCard, { backgroundColor: theme.card, borderColor: theme.background === '#121212' ? '#333' : '#f0f0f0' }]}>
            {/* Header: Info & Stock Display */}
            <TouchableOpacity onPress={() => onOpenDetails(item)} style={{ marginBottom: 15 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <Text style={[styles.productName, { color: theme.text }]}>{item.name}</Text>
                        <Text style={{ fontSize: 15, color: theme.text === '#e0e0e0' ? '#aaa' : '#666', fontWeight: '500' }}>
                            ₱{item.price ? Number(item.price).toFixed(2) : '0.00'}
                        </Text>
                        {item.expiryDate ? (
                            <Text style={{ fontSize: 12, color: '#d9534f', marginTop: 4, fontWeight: '600' }}>Exp: {item.expiryDate}</Text>
                        ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 2, fontWeight: '600' }}>Stock</Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: isLowStock ? colors.danger : colors.primary }}>
                            {displayStock}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Main POS Actions */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 15 }}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: displayStock > 0 ? colors.danger : '#e0e0e0', flex: 2 }]}
                    onPress={() => displayStock > 0 ? sellItem(item.id) : Alert.alert('Out of Stock', 'Cannot sell. Stock is 0.')}
                    disabled={displayStock <= 0}
                >
                    <MaterialIcons name="shopping-cart" size={22} color={displayStock > 0 ? "white" : "#999"} style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, { color: displayStock > 0 ? "white" : "#999" }]}>SELL</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={() => addItem(item.id)}
                >
                    <MaterialIcons name="add-box" size={22} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.actionButtonText}>ADD</Text>
                </TouchableOpacity>
            </View>
            
            {/* Quick Adjust / Admin Footer */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f5f5f5' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ fontSize: 12, color: '#aaa', marginRight: 8, fontWeight: '600' }}>ADJUST:</Text>
                    <TextInput
                        style={[styles.stockInput, { borderColor: pending !== 0 ? colors.accent : '#eee', backgroundColor: theme.background, color: theme.text }]}
                        keyboardType="numeric"
                        value={editStocks[item.id] ?? String(item.stock)}
                        onChangeText={value => handleStockChange(item.id, value)}
                        onBlur={() => saveStock(item.id)}
                        returnKeyType="done"
                    />
                    {pending !== 0 && (
                        <TouchableOpacity onPress={() => saveStock(item.id)} style={{ marginLeft: 10, backgroundColor: colors.accent, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 }}>
                            <Text style={{ color: 'white', fontSize: 11, fontWeight: 'bold' }}>SAVE</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity onPress={() => deleteProduct(item.id)} style={{ padding: 8 }}>
                    <MaterialIcons name="delete-outline" size={22} color="#ccc" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 2.6 AI Chat & Settings Screen
const AIChatScreen = ({ analytics, aiSettings, setAiSettings, chatMessages, setChatMessages, theme }) => {
    const [inputText, setInputText] = useState('');

    const businessTips = [
        "💡 **Tip:** Bundle slow-moving items with popular ones to clear inventory.",
        "💡 **Tip:** Keep your bestsellers at eye level to increase visibility.",
        "💡 **Tip:** Offer a small discount for bulk purchases to increase average order value.",
        "💡 **Tip:** Track which days have the highest sales and stock up before then.",
        "💡 **Tip:** Friendly customer service is the best way to ensure repeat customers."
    ];

    const handleSend = () => {
        if (!inputText.trim()) return;

        const userMsg = { id: Date.now(), text: inputText, sender: 'user' };
        setChatMessages(prev => [...prev, userMsg]);
        setInputText('');

        // AI Simulation Logic
        setTimeout(() => {
            let responseText = "I'm not sure about that. Try asking for 'tips', 'status', or 'low stock'.";
            const lowerInput = userMsg.text.toLowerCase();

            if (lowerInput.includes('tip') || lowerInput.includes('advice')) {
                responseText = businessTips[Math.floor(Math.random() * businessTips.length)];
            } else if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
                responseText = "Hello! 👋 I'm your Tindahan Assistant. How can I help your business today?";
            } else if (lowerInput.includes('low') || lowerInput.includes('stock')) {
                if (analytics?.lowStock?.length > 0) {
                    responseText = `⚠️ **Low Stock Alert:** You are running low on: ${analytics.lowStock.join(', ')}.`;
                } else {
                    responseText = "✅ Your stock levels look good!";
                }
            } else if (lowerInput.includes('profit') || lowerInput.includes('money')) {
                responseText = `💰 Your estimated net profit so far is **₱${analytics?.netProfit || 0}**. Keep it up!`;
            } else if (lowerInput.includes('status') || lowerInput.includes('report')) {
                responseText = `📊 **Status Report:**\nSales: ${analytics?.totalSales} units\nRevenue: ₱${analytics?.totalRevenue}\nTop Item: ${analytics?.top3?.[0] || 'None'}`;
            }

            const aiMsg = { id: Date.now() + 1, text: responseText, sender: 'ai' };
            setChatMessages(prev => [...prev, aiMsg]);
        }, 800);
    };

    const toggleSetting = (key) => {
        setAiSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <View style={{ flex: 1 }}>
            {/* Settings Header */}
            <View style={{ backgroundColor: theme.card, padding: 15, borderBottomWidth: 1, borderColor: theme.background === '#121212' ? '#333' : '#eee' }}>
                <Text style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>🔔 AI Notification Settings</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 5 }}>
                        <Switch value={aiSettings.lowStock} onValueChange={() => toggleSetting('lowStock')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>Low Stock</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 5 }}>
                        <Switch value={aiSettings.slowMoving} onValueChange={() => toggleSetting('slowMoving')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>Slow Moving</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%' }}>
                        <Switch value={aiSettings.fastMoving} onValueChange={() => toggleSetting('fastMoving')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>Fast Moving</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%' }}>
                        <Switch value={aiSettings.forecasts} onValueChange={() => toggleSetting('forecasts')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>Forecasts</Text>
                    </View>
                </View>
            </View>

            {/* Chat Area */}
            <FlatList
                data={chatMessages}
                keyExtractor={item => String(item.id)}
                style={styles.chatContainer}
                renderItem={({ item }) => (
                    <View style={styles.chatBubble(item.sender === 'ai')}>
                        <Text style={styles.chatText(item.sender === 'ai')}>{item.text}</Text>
                    </View>
                )}
            />

            {/* Input Area */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={100}>
                <View style={{ flexDirection: 'row', padding: 10, backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.background === '#121212' ? '#333' : '#eee' }}>
                    <TextInput
                        style={[styles.input, { flex: 1, marginBottom: 0, marginRight: 10, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                        placeholder="Ask for tips, stock status..."
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <Button title="Send" onPress={handleSend} color={colors.primary} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// 2.5 Product Details Modal
const ProductDetailsModal = ({ visible, onClose, product, salesData, onSaveDetails, theme }) => {
    const [price, setPrice] = useState('');
    const [supplier, setSupplier] = useState('');
    const [expYear, setExpYear] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expDay, setExpDay] = useState('');

    useEffect(() => {
        if (product) {
            setPrice(product.price !== undefined ? String(product.price) : '');
            setSupplier(product.supplier || '');
            if (product.expiryDate) {
                const parts = product.expiryDate.split('-');
                if (parts.length === 3) {
                    setExpYear(parts[0]);
                    setExpMonth(parts[1]);
                    setExpDay(parts[2]);
                } else {
                    setExpYear(''); setExpMonth(''); setExpDay('');
                }
            } else {
                setExpYear(''); setExpMonth(''); setExpDay('');
            }
        }
    }, [product]);

    const handleSave = () => {
        if (!product) return; // Prevent error if product is null
        let formattedExpiry = '';
        if (expYear && expMonth && expDay) {
            formattedExpiry = `${expYear}-${expMonth.padStart(2, '0')}-${expDay.padStart(2, '0')}`;
        }
        onSaveDetails(product.id, price, supplier, formattedExpiry);
        onClose();
    };

    if (!product) return null; // This guard is important!

    const totalSold = salesData?.[product.id] || 0;
    const revenue = totalSold * (parseFloat(price) || 0);

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <Text style={styles.modalTitle}>{product.name}</Text>
                    
                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Edit Selling Price (₱):</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                        value={price} 
                        onChangeText={setPrice} 
                        keyboardType="numeric" 
                    />

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Supplier Name:</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                        value={supplier} 
                        onChangeText={setSupplier} 
                        placeholder="e.g., ABC Wholesaler"
                        placeholderTextColor="#888"
                    />

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: '#555' }}>Expiry Date:</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Year</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                                value={expYear} 
                                onChangeText={setExpYear} 
                                keyboardType="numeric" 
                                placeholder="YYYY"
                                placeholderTextColor="#888"
                                maxLength={4}
                            />
                        </View>
                        <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Month</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                                value={expMonth} 
                                onChangeText={setExpMonth} 
                                keyboardType="numeric" 
                                placeholder="MM"
                                placeholderTextColor="#888"
                                maxLength={2}
                            />
                        </View>
                        <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Day</Text>
                            <TextInput 
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                                value={expDay} 
                                onChangeText={setExpDay} 
                                keyboardType="numeric" 
                                placeholder="DD"
                                placeholderTextColor="#888"
                                maxLength={2}
                            />
                        </View>
                    </View>

                    <View style={[styles.statsContainer, { backgroundColor: theme.background }]}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 16 }}>📊 Product Analytics</Text>
                        <Text style={{ color: theme.text }}>📦 Total Units Sold: <Text style={{ fontWeight: 'bold' }}>{totalSold}</Text></Text>
                        <Text style={{ color: theme.text }}>💰 Est. Revenue: <Text style={{ fontWeight: 'bold', color: colors.primary }}>₱{revenue.toFixed(2)}</Text></Text>
                        <Text style={{ color: theme.text }}>📉 Current Stock: <Text style={{ fontWeight: 'bold' }}>{product.stock}</Text></Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ width: '45%' }}><Button title="Cancel" onPress={onClose} color="#888" /></View>
                        <View style={{ width: '45%' }}><Button title="Save" onPress={handleSave} color={colors.primary} /></View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// 3. Analytics Dashboard Screen
const AnalyticsScreen = ({ analytics, salesHistory, profitHistory, aiSettings, theme }) => {
    const screenWidth = Dimensions.get('window').width - 40;
    const chartWidth = Math.max(screenWidth, salesHistory.labels.length * 50);
    
    const [showExpenses, setShowExpenses] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);

    const ChartConfig = {
        backgroundColor: theme.card,
        backgroundGradientFrom: theme.card,
        backgroundGradientTo: theme.background,
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(34, 139, 34, ${opacity})`,
        labelColor: (opacity = 1) => theme.text === '#e0e0e0' ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
        style: { borderRadius: 8 },
        propsForDots: { r: "4", strokeWidth: "2", stroke: colors.primary }
    };
    
    const renderStatCard = (item) => (
        <View style={[styles.statCard, { borderTopWidth: 4, borderTopColor: item.color, backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ backgroundColor: item.color + '15', padding: 8, borderRadius: 50 }}>
                    <MaterialIcons name={item.icon} size={24} color={item.color} />
                </View>
            </View>
            <View>
                <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{item.value}</Text>
                <Text style={styles.statTitle}>{item.title}</Text>
            </View>
        </View>
    );
    
    if (!analytics) return <Text style={{ padding: 20, textAlign: 'center' }}>Loading analytics...</Text>;

    const printAnalytics = async () => {
        const html = `
            <html>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #333; }
                        h1 { color: #228B22; text-align: center; margin-bottom: 10px; }
                        h2 { border-bottom: 2px solid #228B22; padding-bottom: 5px; margin-top: 20px; color: #444; }
                        .summary-grid { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
                        .card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; flex: 1; min-width: 120px; background-color: #f9f9f9; text-align: center; }
                        .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
                        .card p { margin: 0; font-size: 18px; font-weight: bold; color: #228B22; }
                        .list-item { padding: 5px 0; border-bottom: 1px solid #eee; }
                        .suggestions { background-color: #e9f7e9; padding: 15px; border-radius: 8px; border: 1px solid #228B22; }
                    </style>
                </head>
                <body>
                    <h1>BantayTindahan AI Report</h1>
                    <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleString()}</p>

                    <h2>💰 Financial Overview</h2>
                    <div class="summary-grid">
                        <div class="card"><h3>Revenue</h3><p>₱${analytics.totalRevenue}</p></div>
                        <div class="card"><h3>Total Expenses</h3><p>₱${analytics.totalExpenses}</p></div>
                        <div class="card"><h3>Net Profit</h3><p>₱${analytics.netProfit}</p></div>
                    </div>
                    <p style="text-align: center; font-size: 12px; color: #666;">(Expenses include Cost of Goods Sold + ₱${analytics.totalOperationalExpenses} in OpEx)</p>

                    <h2>💸 Expense Log</h2>
                    <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                        ${analytics.expenseList && analytics.expenseList.length > 0 ? 
                            analytics.expenseList.map(exp => `
                                <div class="list-item" style="display: flex; justify-content: space-between;">
                                    <span>${new Date(exp.date).toLocaleDateString()} - ${exp.description}</span>
                                    <span style="color: #dc3545; font-weight: bold;">-₱${Number(exp.amount).toFixed(2)}</span>
                                </div>
                            `).join('') 
                            : '<p style="text-align: center; color: #888;">No expenses recorded.</p>'
                        }
                    </div>

                    <h2>� Inventory Health</h2>
                    <div class="summary-grid">
                        <div class="card"><h3>Total Sales</h3><p>${analytics.totalSales} units</p></div>
                        <div class="card"><h3>Avg Sales/Item</h3><p>${analytics.avgSalesPerProduct}</p></div>
                    </div>

                    <h2>🏆 Performance</h2>
                    <p><strong>Top 3 Bestsellers:</strong> ${analytics.top3?.join(', ') || 'None'}</p>
                    <p><strong>Least Sold:</strong> ${analytics.least3?.join(', ') || 'None'}</p>
                    <p><strong>Never Sold:</strong> ${analytics.neverSold?.join(', ') || 'None'}</p>

                    <h2>⚠️ Alerts</h2>
                    <p><strong>Low Stock Items:</strong> ${analytics.lowStock?.length > 0 ? analytics.lowStock.join(', ') : 'None'}</p>

                    <h2>💡 AI Suggestions</h2>
                    <div class="suggestions">
                        ${analytics.suggestions.split('\n').map(s => `<div class="list-item">${s}</div>`).join('')}
                    </div>
                </body>
            </html>
        `;

        try {
            const { uri } = await Print.printToFileAsync({ html });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            Alert.alert("Error", "Could not generate or share PDF.");
            console.error(error);
        }
    };

    // Generate filtered suggestions based on settings
    const getFilteredSuggestions = () => {
        let suggestions = [];
        
        // 1. Restock / Low Stock (Prioritize detailed plan)
        if (aiSettings.lowStock) {
            if (analytics.restockSuggestions?.length > 0) {
                 suggestions.push(`🚚 **Restock Plan:**\n${analytics.restockSuggestions.join('\n')}`);
            } else if (analytics.lowStock?.length > 0) {
                 suggestions.push(`🚨 **Restock Alert:** Items below 5 units: ${analytics.lowStock.join(', ')}.`);
            }
        }

        // 2. Forecasts
        if (aiSettings.forecasts && analytics.forecasts?.length > 0) {
            suggestions.push(`🔮 **Demand Forecast:** Likely to run out soon: ${analytics.forecasts.join(', ')}.`);
        }

        // 3. Dead Stock (Never Sold)
        if (analytics.neverSold?.length > 0) {
             suggestions.push(`🗑️ **Dead Stock:** These items have never sold: ${analytics.neverSold.join(', ')}.`);
        }

        // 4. Profit Insight
        const margin = analytics.totalRevenue > 0 ? (analytics.netProfit / analytics.totalRevenue) * 100 : 0;
        if (analytics.netProfit > 0) {
            suggestions.push(`💰 **Profit Trend:** Healthy margin of ~${margin.toFixed(0)}%.`);
        }

        if (aiSettings.fastMoving && analytics.mostSold && analytics.mostSold !== 'N/A') {
            suggestions.push(`📈 **Fast Mover:** Increase stock for ${analytics.mostSold}.`);
        }
        if (aiSettings.slowMoving && analytics.leastSold && analytics.leastSold !== 'N/A') {
            suggestions.push(`📉 **Slow Mover:** Consider promos/discount on ${analytics.leastSold}.`);
        }
        if (suggestions.length === 0) {
             suggestions.push("✅ **Inventory looks healthy!** No active alerts based on your settings.");
        }
        return suggestions;
    };

    // Helper for uniform sections
    const renderCollapsibleSection = (title, isOpen, toggle, content, titleColor = colors.text) => (
        <View style={[styles.sectionCard, { backgroundColor: theme.card }]}>
            <TouchableOpacity onPress={toggle} style={[styles.sectionHeader, { marginBottom: isOpen ? 10 : 0 }]}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: titleColor }}>{title}</Text>
                <Text style={{ color: colors.accent, fontWeight: 'bold', fontSize: 18 }}>{isOpen ? '−' : '+'}</Text>
            </TouchableOpacity>
            {isOpen && content}
        </View>
    );

    return (
        <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
            <View style={{ margin: 16, marginBottom: 4 }}>
                <Button title="🖨️ Export PDF Report" onPress={printAnalytics} color={colors.accent} />
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginTop: 10 }}>
                {[
                    { title: "Revenue", value: `₱${analytics.totalRevenue}`, icon: "attach-money", color: colors.primary },
                    { title: "Expenses", value: `₱${analytics.totalExpenses}`, icon: "money-off", color: colors.danger },
                    { title: "Net Profit", value: `₱${analytics.netProfit}`, icon: "trending-up", color: parseFloat(analytics.netProfit) >= 0 ? colors.primary : colors.danger },
                    { title: "Units Sold", value: analytics.totalSales, icon: "shopping-cart", color: colors.accent },
                    { title: "Low Stock", value: analytics.lowStock?.length || 0, icon: "warning", color: analytics.lowStock?.length > 0 ? colors.danger : colors.primary },
                    { title: "Top Item", value: analytics.top3?.[0] || 'N/A', icon: "star", color: "#FFD700" }
                ].map((stat, index) => (
                    <View key={index} style={{ width: '50%', padding: 6 }}>
                        {renderStatCard(stat)}
                    </View>
                ))}
            </View>

            {/* Expense History List */}
            {renderCollapsibleSection(
                "💸 Expense History",
                showExpenses,
                () => setShowExpenses(!showExpenses),
                analytics.expenseList && analytics.expenseList.length > 0 ? (
                    <View>
                        {analytics.expenseList.map((exp, index) => (
                            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: index === analytics.expenseList.length - 1 ? 0 : 1, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee', paddingVertical: 8 }}>
                                <View>
                                    <Text style={{ fontWeight: 'bold', color: '#555' }}>{exp.description}</Text>
                                    <Text style={{ fontSize: 12, color: '#888' }}>{new Date(exp.date).toLocaleDateString()}</Text>
                                </View>
                                <Text style={{ fontWeight: 'bold', color: colors.danger }}>-₱{Number(exp.amount).toFixed(2)}</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <Text style={{ color: '#666', fontStyle: 'italic' }}>No expenses logged yet.</Text>
                )
            )}

            {/* AI Recommendations */}
            {renderCollapsibleSection(
                "💡 Tindahan AI Suggestions",
                showSuggestions,
                () => setShowSuggestions(!showSuggestions),
                getFilteredSuggestions().map((line, index) => (
                    <Text key={index} style={{ fontSize: 14, color: theme.text, marginBottom: 6 }}>
                        {line.replace(/\*\*(.*?)\*\*/g, (match, p1) => p1)}
                    </Text>
                )),
                colors.primary
            )}

            {/* Sales History Chart */}
            <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>📈 Sales Trend (Last 7 Days)</Text>
                {salesHistory.data.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <LineChart
                            data={{
                                labels: salesHistory.labels,
                                datasets: [{ data: salesHistory.data }],
                            }}
                            width={chartWidth}
                            height={220}
                            chartConfig={ChartConfig}
                            bezier
                            style={{ borderRadius: 8 }}
                        />
                    </ScrollView>
                ) : <Text style={{color: '#888', fontStyle: 'italic'}}>No sales data yet.</Text>}
            </View>

            {/* Pie Chart: Sales Distribution */}
            {analytics.salesDistribution && analytics.salesDistribution.length > 0 && (
                <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>🍰 Top Products Share</Text>
                    <PieChart
                        data={analytics.salesDistribution}
                        width={screenWidth - 40}
                        height={200}
                        chartConfig={ChartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        absolute
                    />
                </View>
            )}
        </ScrollView>
    );
};

// 4. Add Product Screen
const AddProductScreen = ({ 
    newProductName, setNewProductName, 
    newProductStock, setNewProductStock, 
    newProductPrice, setNewProductPrice, 
    newProductCost, setNewProductCost, 
    newProductSupplier, setNewProductSupplier, addProduct,
    newExpYear, setNewExpYear, newExpMonth, setNewExpMonth, newExpDay, setNewExpDay,
    expenseDescription, setExpenseDescription,
    expenseAmount, setExpenseAmount,
    addExpense,
    theme
}) => {
    const [mode, setMode] = useState('product'); // 'product' | 'expense'

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Toggle Switch */}
            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: theme.background === '#121212' ? '#333' : '#e0e0e0', borderRadius: 12, padding: 4 }}>
                <TouchableOpacity 
                    onPress={() => setMode('product')}
                    style={{ flex: 1, paddingVertical: 10, backgroundColor: mode === 'product' ? theme.card : 'transparent', borderRadius: 10, alignItems: 'center', elevation: mode === 'product' ? 2 : 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }}
                >
                    <Text style={{ fontWeight: 'bold', color: mode === 'product' ? colors.primary : '#888' }}>New Product</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setMode('expense')}
                    style={{ flex: 1, paddingVertical: 10, backgroundColor: mode === 'expense' ? theme.card : 'transparent', borderRadius: 10, alignItems: 'center', elevation: mode === 'expense' ? 2 : 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }}
                >
                    <Text style={{ fontWeight: 'bold', color: mode === 'expense' ? colors.danger : '#888' }}>Log Expense</Text>
                </TouchableOpacity>
            </View>
            
            <View style={[styles.sectionCard, { marginHorizontal: 0, padding: 20, backgroundColor: theme.card }]}>
                {mode === 'product' ? (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ backgroundColor: colors.primary + '15', padding: 10, borderRadius: 50, marginRight: 10 }}>
                                <MaterialIcons name="inventory" size={24} color={colors.primary} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Product Details</Text>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>PRODUCT NAME</Text>
                            <TextInput
                                value={newProductName}
                                onChangeText={setNewProductName}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. C2 Green Tea"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>INITIAL STOCK</Text>
                            <TextInput
                                value={newProductStock}
                                onChangeText={setNewProductStock}
                                keyboardType="numeric"
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="0"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                            <View style={{ width: '48%' }}>
                                <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>SELLING PRICE</Text>
                                <TextInput
                                    value={newProductPrice}
                                    onChangeText={setNewProductPrice}
                                    keyboardType="numeric"
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                    placeholder="₱ 0.00"
                                    placeholderTextColor="#888"
                                />
                            </View>
                            <View style={{ width: '48%' }}>
                                <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>COST PRICE</Text>
                                <TextInput
                                    value={newProductCost}
                                    onChangeText={setNewProductCost}
                                    keyboardType="numeric"
                                    style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                    placeholder="₱ 0.00"
                                    placeholderTextColor="#888"
                                />
                            </View>
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>SUPPLIER (OPTIONAL)</Text>
                            <TextInput
                                value={newProductSupplier}
                                onChangeText={setNewProductSupplier}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. ABC Wholesaler"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>EXPIRY DATE (OPTIONAL)</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ width: '30%' }}>
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Year</Text>
                                    <TextInput
                                        value={newExpYear}
                                        onChangeText={setNewExpYear}
                                        keyboardType="numeric"
                                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                        placeholder="YYYY"
                                        placeholderTextColor="#888"
                                        maxLength={4}
                                    />
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Month</Text>
                                    <TextInput
                                        value={newExpMonth}
                                        onChangeText={setNewExpMonth}
                                        keyboardType="numeric"
                                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                        placeholder="MM"
                                        placeholderTextColor="#888"
                                        maxLength={2}
                                    />
                                </View>
                                <View style={{ width: '30%' }}>
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>Day</Text>
                                    <TextInput
                                        value={newExpDay}
                                        onChangeText={setNewExpDay}
                                        keyboardType="numeric"
                                        style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                        placeholder="DD"
                                        placeholderTextColor="#888"
                                        maxLength={2}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity 
                            onPress={addProduct}
                            style={{ backgroundColor: colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 2 }}
                        >
                            <MaterialIcons name="add-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Add to Inventory</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ backgroundColor: colors.danger + '15', padding: 10, borderRadius: 50, marginRight: 10 }}>
                                <MaterialIcons name="receipt-long" size={24} color={colors.danger} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>Expense Details</Text>
                        </View>
                        
                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>DESCRIPTION</Text>
                            <TextInput
                                value={expenseDescription}
                                onChangeText={setExpenseDescription}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. Electricity Bill"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: '#666', marginBottom: 5, fontWeight: '600' }}>AMOUNT</Text>
                            <TextInput
                                value={expenseAmount}
                                onChangeText={setExpenseAmount}
                                keyboardType="numeric"
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="₱ 0.00"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <TouchableOpacity 
                            onPress={addExpense}
                            style={{ backgroundColor: colors.danger, padding: 15, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 2 }}
                        >
                            <MaterialIcons name="remove-circle-outline" size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Log Expense</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
};

// --- Main Application Component ---

export default function Index() {
    const [items, setItems] = useState([]);
    const [editStocks, setEditStocks] = useState({});
    const [pendingChanges, setPendingChanges] = useState({});
    const [isOffline, setIsOffline] = useState(false);
    const [networkEnabled, setNetworkEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);

    const theme = isDarkMode ? darkColors : colors;
    
    // Modal state
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Auth state
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMode, setAuthMode] = useState('login');

    // Analytics state
    const [analytics, setAnalytics] = useState(null);
    const [salesHistory, setSalesHistory] = useState({ labels: [], data: [] });
    const [profitHistory, setProfitHistory] = useState({ labels: [], data: [] });
    
    // AI Chat & Settings State
    const [aiSettings, setAiSettings] = useState({
        lowStock: true,
        slowMoving: true,
        fastMoving: true,
        forecasts: true,
    });
    const [chatMessages, setChatMessages] = useState([{ id: 1, text: "Hello! I'm your Tindahan AI Assistant. Ask me for business tips or inventory status!", sender: 'ai' }]);

    // UI/Filter state
    const [activeTab, setActiveTab] = useState('inventory');
    const [search, setSearch] = useState('');

    // Add Product state
    const [newProductName, setNewProductName] = useState('');
    const [newProductStock, setNewProductStock] = useState('');
    const [newProductPrice, setNewProductPrice] = useState('');
    const [newProductCost, setNewProductCost] = useState('');
    const [newProductSupplier, setNewProductSupplier] = useState('');
    const [newExpYear, setNewExpYear] = useState('');
    const [newExpMonth, setNewExpMonth] = useState('');
    const [newExpDay, setNewExpDay] = useState('');

    // Expense State
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger analytics reload

    const filteredItems = search.trim()
        ? items.filter(item =>
            item.name.toLowerCase().includes(search.trim().toLowerCase())
        )
        : items;

    // --- Effects ---

    // 1. Auth State Listener & Data Fetch & Cleanup
    useEffect(() => {
        let unsubscribeItems;
        const unsubscribe = auth.onAuthStateChanged(async (u) => {
            setUser(u);
            if (u) {
                // 1. Realtime Listener for Items (Handles Offline/Sync)
                unsubscribeItems = onSnapshot(collection(db, 'users', u.uid, 'items'), { includeMetadataChanges: true }, (snapshot) => {
                    const itemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setItems(itemsData);
                    
                    // Sync editStocks for new items
                    setEditStocks(prev => {
                        const newStocks = { ...prev };
                        itemsData.forEach(item => {
                            if (newStocks[item.id] === undefined) {
                                newStocks[item.id] = String(item.stock);
                            }
                        });
                        return newStocks;
                    });

                    // Check if data is from cache (Offline Mode)
                    setIsOffline(snapshot.metadata.fromCache);
                });
            } else {
                setItems([]);
                setEditStocks({});
                setAnalytics(null);
                setIsOffline(false);
            }
        });
        return () => { unsubscribe(); if (unsubscribeItems) unsubscribeItems(); };
    }, []);

    // 2. Fetch Analytics on Data Change
    useEffect(() => {
        if (user) {
            fetchAnalyticsFromCloud(user.uid, setAnalytics, setSalesHistory, setProfitHistory);
        }
    }, [items, user, refreshTrigger]);
    
    // --- Handlers ---

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setEmail('');
            setPassword('');
        } catch (e) {
            Alert.alert('Login failed', e.message);
        }
    };

    const handleRegister = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setEmail('');
            setPassword('');
        } catch (e) {
            Alert.alert('Registration failed', e.message);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
    };

    const sellItem = (id) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: (prev[id] ?? 0) - 1,
        }));
        if (user) logSaleToCloud(user.uid, id, 1);
    };

    const addItem = (id) => {
        setPendingChanges(prev => ({
            ...prev,
            [id]: (prev[id] ?? 0) + 1,
        }));
    };

    const handleStockChange = (id, value) => {
        if (/^\d*$/.test(value)) {
            setEditStocks(prev => ({ ...prev, [id]: value }));
            setPendingChanges(prev => ({ ...prev, [id]: 0 })); // Reset pending changes if user types
        }
    };

    const saveStock = async (id) => {
        if (!user) return;
        
        let newStock;
        let item = items.find(i => i.id === id);

        if (!item) return;

        if (pendingChanges[id] !== 0 && pendingChanges[id] !== undefined) {
            newStock = (item.stock || 0) + (pendingChanges[id] ?? 0);
            setEditStocks(prev => ({ ...prev, [id]: String(newStock) }));
            setPendingChanges(prev => ({ ...prev, [id]: 0 }));
        } else {
            newStock = parseInt(editStocks[id] || '0', 10);
        }

        if (newStock < 0) {
            Alert.alert("Invalid Stock", "Stock cannot be negative.");
            newStock = item.stock; // revert to original stock
            setEditStocks(prev => ({ ...prev, [id]: String(newStock) }));
            setPendingChanges(prev => ({ ...prev, [id]: 0 }));
            return;
        }

        setItems(prevItems =>
            prevItems.map(i => (i.id === id ? { ...i, stock: newStock } : i))
        );

        await saveItemToCloud(user.uid, { ...item, stock: newStock });
    };

    const addProduct = async () => {
        if (!user) return;
        const name = newProductName.trim();
        const stock = parseInt(newProductStock, 10);
        const price = parseFloat(newProductPrice) || 0;
        const cost = parseFloat(newProductCost) || 0;
        const supplier = newProductSupplier.trim() || 'Unknown';
        let expiryDate = '';
        if (newExpYear && newExpMonth && newExpDay) {
            expiryDate = `${newExpYear}-${newExpMonth.padStart(2, '0')}-${newExpDay.padStart(2, '0')}`;
        }

        if (!name || isNaN(stock) || stock < 0) {
            Alert.alert('Validation Error', 'Please enter a valid name and non-negative stock.');
            return;
        }

        // Check for duplicates before adding
        const duplicate = items.some(item => item.name.trim().toLowerCase() === name.toLowerCase());
        if (duplicate) {
            Alert.alert('Duplicate Product', 'A product with this name already exists. Please use the existing entry.');
            return;
        }

        const newId = doc(collection(db, 'users', user.uid, 'items')).id;
        const newItem = { id: newId, name, stock, price, cost, supplier, expiryDate };

        setItems(prev => [...prev, newItem]);
        setEditStocks(prev => ({ ...prev, [newId]: String(stock) }));
        setNewProductName('');
        setNewProductStock('');
        setNewProductPrice('');
        setNewProductCost('');
        setNewProductSupplier('');
        setNewExpYear('');
        setNewExpMonth('');
        setNewExpDay('');
        setActiveTab('inventory'); // Switch to main list after adding

        await saveItemToCloud(user.uid, newItem);
    };

    const addExpense = async () => {
        if (!user) return;
        const amount = parseFloat(expenseAmount);
        if (!expenseDescription.trim() || isNaN(amount) || amount < 0) {
            Alert.alert('Validation Error', 'Please enter a valid description and amount.');
            return;
        }

        await addDoc(collection(db, 'users', user.uid, 'expenses'), {
            description: expenseDescription.trim(),
            amount: amount,
            date: new Date().toISOString()
        });

        setExpenseDescription('');
        setExpenseAmount('');
        setRefreshTrigger(prev => prev + 1); // Refresh analytics
        Alert.alert('Success', 'Expense logged successfully.');
    };

    const deleteProduct = (id) => {
        const product = items.find(item => item.id === id);
        Alert.alert(
            'Delete Product',
            `Are you sure you want to delete "${product?.name}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setItems(prevItems => prevItems.filter(item => item.id !== id));
                        setEditStocks(prev => {
                            const updated = { ...prev };
                            delete updated[id];
                            return updated;
                        });
                        if (user) {
                            await deleteItemFromCloud(user.uid, id);
                        }
                    },
                },
            ]
        );
    };

    const handleOpenDetails = (item) => setSelectedProduct(item);
    const handleCloseDetails = () => setSelectedProduct(null);
    
    const handleSaveDetails = async (id, newPrice, newSupplier, newExpiry) => {
        if (!user) return;
        const priceNum = parseFloat(newPrice);
        if (isNaN(priceNum) || priceNum < 0) {
            Alert.alert("Invalid Price", "Please enter a valid positive number.");
            return;
        }
        setItems(prev => prev.map(item => item.id === id ? { ...item, price: priceNum, supplier: newSupplier, expiryDate: newExpiry } : item));
        await updateItemDetailsInCloud(user.uid, id, { price: priceNum, supplier: newSupplier, expiryDate: newExpiry });
    };

    const toggleNetwork = async () => {
        try {
            if (networkEnabled) {
                await disableNetwork(db);
                setNetworkEnabled(false);
            } else {
                await enableNetwork(db);
                setNetworkEnabled(true);
            }
        } catch (e) {
            console.error("Network toggle error:", e);
        }
    };

    // --- Main Render ---

    if (!user) {
        return <AuthScreen {...{ email, setEmail, password, setPassword, authMode, setAuthMode, handleLogin, handleRegister, theme }} />;
    }

    const totalItems = items.length;
    const totalStock = items.reduce((sum, item) => sum + (item.stock || 0), 0);

    // Dynamic Tab Content
    const renderContent = () => {
        switch (activeTab) {
            case 'add':
                return <AddProductScreen {...{ 
                    newProductName, setNewProductName, 
                    newProductStock, setNewProductStock, 
                    newProductPrice, setNewProductPrice, 
                    newProductCost, setNewProductCost, 
                    newProductSupplier, setNewProductSupplier, addProduct,
                    newExpYear, setNewExpYear, newExpMonth, setNewExpMonth, newExpDay, setNewExpDay,
                    expenseDescription, setExpenseDescription,
                    expenseAmount, setExpenseAmount,
                    addExpense,
                    theme
                }} />;
            case 'analytics':
                return <AnalyticsScreen analytics={analytics} salesHistory={salesHistory} profitHistory={profitHistory} aiSettings={aiSettings} theme={theme} />;
            case 'chat':
                return <AIChatScreen analytics={analytics} aiSettings={aiSettings} setAiSettings={setAiSettings} chatMessages={chatMessages} setChatMessages={setChatMessages} theme={theme} />;
            case 'inventory':
            default:
                return (
                    <View style={{ flex: 1, backgroundColor: theme.background }}>
                        {/* Search and Summary */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.background }}>
                            <TextInput
                                placeholder="🔍 Search Product..."
                                placeholderTextColor="#888"
                                value={search}
                                onChangeText={setSearch}
                                style={[styles.input, { flex: 1, marginRight: 12, backgroundColor: theme.card, color: theme.text, borderWidth: 0, elevation: 1 }]}
                            />
                            <View style={{ alignItems: 'flex-end', opacity: 0.8 }}>
                                <Text style={{ fontSize: 11, color: theme.text }}>ITEMS: <Text style={{ fontWeight: 'bold' }}>{totalItems}</Text></Text>
                                <Text style={{ fontSize: 11, color: theme.text }}>STOCK: <Text style={{ fontWeight: 'bold' }}>{totalStock}</Text></Text>
                            </View>
                        </View>
                        
                        {/* Product List */}
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ProductCard 
                                    item={item}
                                    editStocks={editStocks}
                                    pendingChanges={pendingChanges}
                                    handleStockChange={handleStockChange}
                                    saveStock={saveStock}
                                    sellItem={sellItem}
                                    addItem={addItem}
                                    deleteProduct={deleteProduct}
                                    onOpenDetails={handleOpenDetails}
                                    theme={theme}
                                />
                            )}
                            ListEmptyComponent={() => (
                                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                                    {search ? `No results found for "${search}".` : "No products added yet. Go to 'Add Product' to start."}
                                </Text>
                            )}
                            contentContainerStyle={{ paddingBottom: 60 }}
                        />
                    </View>
                );
        }
    };

    // Tab Bar Component
    const TabBar = () => (
        <View style={[styles.tabBar, { backgroundColor: theme.card, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee' }]}>
            {['inventory', 'add', 'analytics', 'chat'].map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={styles.tabButton}
                    onPress={() => setActiveTab(tab)}
                >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                        {tab === 'inventory' ? '📦 POS' : tab === 'add' ? '➕ Add' : tab === 'analytics' ? '📊 Data' : '🤖 Chat'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={styles.title}>BantayTindahan AI</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
                            <TouchableOpacity onPress={() => setIsDarkMode(!isDarkMode)} style={{ marginRight: 10 }}>
                                <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={22} color={isDarkMode ? "#ffd54f" : "#f57c00"} />
                            </TouchableOpacity>
                            <MaterialIcons name={networkEnabled ? "wifi" : "wifi-off"} size={20} color={networkEnabled ? colors.primary : "#888"} style={{ marginRight: -4 }} />
                            <View style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}>
                                <Switch
                                    value={networkEnabled}
                                    onValueChange={toggleNetwork}
                                    trackColor={{ false: "#767577", true: colors.primary }}
                                    thumbColor={"#f4f3f4"}
                                />
                            </View>
                        </View>
                    </View>
                    <Button title="Logout" onPress={handleLogout} color="#888" />
                </View>
            </View>
            
            {/* Offline Banner */}
            {(isOffline || !networkEnabled) && (
                <View style={styles.offlineBanner}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>☁️ Offline Mode: Changes will sync when online</Text>
                </View>
            )}

            {/* Tab Navigation */}
            <TabBar />
            
            {/* Main Content */}
            <View style={{ flex: 1 }}>
                {renderContent()}
            </View>

            {/* Product Details Modal */}
            <ProductDetailsModal 
                visible={!!selectedProduct} 
                onClose={handleCloseDetails} 
                product={selectedProduct} 
                salesData={analytics?.salesByItem}
                onSaveDetails={handleSaveDetails}
                theme={theme}
            />
        </View>
    );
}