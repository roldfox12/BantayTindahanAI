import { View, Text, FlatList, Button, TextInput, Alert, Dimensions, ScrollView, StyleSheet, TouchableOpacity, Modal, Switch, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker'; // Keep for compatibility if needed elsewhere
import { MaterialIcons } from '@expo/vector-icons';

// Firebase imports
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, setDoc, doc, deleteDoc, updateDoc, onSnapshot, initializeFirestore, persistentLocalCache, disableNetwork, enableNetwork } from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, initializeAuth, getReactNativePersistence, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
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

// --- Translations ---
const translations = {
    en: {
        welcomeBack: "Welcome back, Bantay!",
        startJourney: "Start your smart store journey",
        login: "Login",
        createAccount: "Create Account",
        register: "Register",
        emailPlaceholder: "Email Address",
        passwordPlaceholder: "Password",
        noAccount: "Don't have an account? Register",
        hasAccount: "Already have an account? Login",
        posTab: "📦 POS",
        addTab: "➕ Add",
        dataTab: "📊 Data",
        chatTab: "🤖 Chat",
        searchPlaceholder: "🔍 Search Product...",
        items: "ITEMS",
        stock: "STOCK",
        sell: "SELL",
        add: "ADD",
        onlineMode: "Online Mode",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        logout: "Logout",
        language: "Language",
        productDetails: "Product Details",
        productName: "PRODUCT NAME",
        initialStock: "INITIAL STOCK",
        sellingPrice: "SELLING PRICE",
        costPrice: "COST PRICE",
        supplier: "SUPPLIER (OPTIONAL)",
        expiryDate: "EXPIRY DATE (OPTIONAL)",
        addToInventory: "Add to Inventory",
        expenseDetails: "Expense Details",
        description: "DESCRIPTION",
        amount: "AMOUNT",
        logExpense: "Log Expense",
        newProduct: "New Product",
        revenue: "Revenue",
        expenses: "Expenses",
        netProfit: "Net Profit",
        unitsSold: "Units Sold",
        lowStock: "Low Stock",
        topSeller: "Top Seller",
        transactionHistory: "💸 Transaction History",
        aiSuggestions: "💡 Tindahan AI Suggestions",
        salesTrend: "📈 Sales Trend (Last 7 Days)",
        topProductsShare: "🍰 Top Products Share",
        exportPdf: "🖨️ Export PDF",
        resetData: "🗑️ Reset Data",
        last7Days: "Last 7 Days",
        last30Days: "Last 30 Days",
        filterByProduct: "Filter by Product",
        showAllProducts: "Show All Products",
        tapPoint: "👆 Tap a point to see daily breakdown",
        salesOn: "📅 Sales on",
        noSales: "No sales recorded.",
        bulkSell: "Bulk Sell",
        bulkAdd: "Bulk Add",
        enterQuantity: "Enter Quantity:",
        confirm: "Confirm",
        cancel: "Cancel",
        save: "Save",
        confirmDelete: "Confirm & Delete",
        enterPasswordConfirm: "Enter Password to Confirm",
        securityMessage: "For your security, please enter your password to delete all data. This action cannot be undone.",
        aiNotificationSettings: "🔔 AI Notification Settings",
        slowMoving: "Slow Moving",
        fastMoving: "Fast Moving",
        forecasts: "Forecasts",
        askTips: "Ask for tips, stock status...",
        send: "Send",
        editSellingPrice: "Edit Selling Price (₱):",
        editCostPrice: "Edit Cost Price (₱):",
        supplierName: "Supplier Name:",
        year: "Year",
        month: "Month",
        day: "Day",
        productAnalytics: "📊 Product Analytics",
        totalUnitsSold: "📦 Total Units Sold:",
        estRevenue: "💰 Est. Revenue:",
        currentStock: "📉 Current Stock:",
        confirmLogout: "Confirm Logout",
        logoutMessage: "Are you sure you want to log out?",
        deleteProductTitle: "Delete Product",
        deleteProductMsg: "Are you sure you want to delete",
        thisCannotBeUndone: "This cannot be undone.",
        outOfStock: "Out of Stock",
        outOfStockMsg: "This item is out of stock.",
        validationError: "Validation Error",
        validationMsg: "Please enter a valid name and non-negative stock.",
        duplicateProduct: "Duplicate Product",
        duplicateMsg: "A product with this name already exists. Please use the existing entry.",
        expenseLogged: "Expense logged successfully.",
        invalidInput: "Invalid Input",
        invalidInputMsg: "Please enter valid positive numbers for price and cost.",
        invalidQuantity: "Invalid Quantity",
        invalidQuantityMsg: "Please enter a valid positive number.",
        notEnoughStock: "Not Enough Stock",
        notEnoughStockMsg: "Cannot sell",
        unitsOnly: "units. Only",
        available: "available.",
        error: "Error",
        passwordEmpty: "Password cannot be empty.",
        resetComplete: "Reset Complete",
        resetCompleteMsg: "All data has been cleared.",
        authFailed: "Authentication Failed",
        loginFailed: "Login failed",
        regFailed: "Registration failed",
        offlineMode: "☁️ Offline Mode: Changes will sync when online"
    },
    tl: {
        welcomeBack: "Maligayang pagbabalik, Bantay!",
        startJourney: "Simulan ang iyong smart store journey",
        login: "Mag-login",
        createAccount: "Gumawa ng Account",
        register: "Mag-rehistro",
        emailPlaceholder: "Email Address",
        passwordPlaceholder: "Password",
        noAccount: "Wala pang account? Mag-rehistro",
        hasAccount: "May account na? Mag-login",
        posTab: "📦 POS",
        addTab: "➕ Dagdag",
        dataTab: "📊 Datos",
        chatTab: "🤖 Chat",
        searchPlaceholder: "🔍 Hanapin ang Produkto...",
        items: "MGA ITEM",
        stock: "STOCK",
        sell: "BENTA",
        add: "DAGDAG",
        onlineMode: "Online Mode",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        logout: "Mag-logout",
        language: "Wika",
        productDetails: "Detalye ng Produkto",
        productName: "PANGALAN NG PRODUKTO",
        initialStock: "PANIMULANG STOCK",
        sellingPrice: "PRESULONG BENTA",
        costPrice: "PUHUNAN",
        supplier: "SUPPLIER (OPSYONAL)",
        expiryDate: "PETSA NG PAGKA-EXPIRE (OPSYONAL)",
        addToInventory: "Idagdag sa Imbentaryo",
        expenseDetails: "Detalye ng Gastusin",
        description: "PAGLALARAWAN",
        amount: "HALAGA",
        logExpense: "I-log ang Gastos",
        newProduct: "Bagong Produkto",
        revenue: "Kita",
        expenses: "Gastusin",
        netProfit: "Tubong Net",
        unitsSold: "Nabentang Yunit",
        lowStock: "Mababang Stock",
        topSeller: "Mabenta",
        transactionHistory: "💸 Kasaysayan ng Transaksyon",
        aiSuggestions: "💡 Mga Suhestiyon ng Tindahan AI",
        salesTrend: "📈 Takbo ng Benta (Huling 7 Araw)",
        topProductsShare: "🍰 Bahagi ng Nangungunang Produkto",
        exportPdf: "🖨️ I-export ang PDF",
        resetData: "🗑️ I-reset ang Datos",
        last7Days: "Huling 7 Araw",
        last30Days: "Huling 30 Araw",
        filterByProduct: "I-filter ayon sa Produkto",
        showAllProducts: "Ipakita Lahat ng Produkto",
        tapPoint: "👆 I-tap ang punto para makita ang detalye",
        salesOn: "📅 Benta noong",
        noSales: "Walang naitalang benta.",
        bulkSell: "Maramihang Benta",
        bulkAdd: "Maramihang Dagdag",
        enterQuantity: "Ilagay ang Dami:",
        confirm: "Kumpirmahin",
        cancel: "Kanselahin",
        save: "I-save",
        confirmDelete: "Kumpirmahin at Burahin",
        enterPasswordConfirm: "Ilagay ang Password para Kumpirmahin",
        securityMessage: "Para sa iyong seguridad, ilagay ang iyong password upang burahin ang lahat ng datos. Hindi na ito maibabalik.",
        aiNotificationSettings: "🔔 Mga Setting ng AI Notification",
        slowMoving: "Mabagal na Benta",
        fastMoving: "Mabilis na Benta",
        forecasts: "Pagtataya",
        askTips: "Humingi ng tips, status ng stock...",
        send: "Ipadala",
        editSellingPrice: "I-edit ang Presyong Benta (₱):",
        editCostPrice: "I-edit ang Puhunan (₱):",
        supplierName: "Pangalan ng Supplier:",
        year: "Taon",
        month: "Buwan",
        day: "Araw",
        productAnalytics: "📊 Analytics ng Produkto",
        totalUnitsSold: "📦 Kabuuang Nabenta:",
        estRevenue: "💰 Est. Kita:",
        currentStock: "📉 Kasalukuyang Stock:",
        confirmLogout: "Kumpirmahin ang Pag-logout",
        logoutMessage: "Sigurado ka bang gusto mong mag-logout?",
        deleteProductTitle: "Burahin ang Produkto",
        deleteProductMsg: "Sigurado ka bang gusto mong burahin ang",
        thisCannotBeUndone: "Hindi na ito maibabalik.",
        outOfStock: "Wala nang Stock",
        outOfStockMsg: "Ang item na ito ay wala nang stock.",
        validationError: "Error sa Validasyon",
        validationMsg: "Mangyaring maglagay ng valid na pangalan at hindi negatibong stock.",
        duplicateProduct: "Dobleng Produkto",
        duplicateMsg: "Mayroon nang produkto na may ganitong pangalan. Gamitin ang umiiral na entry.",
        expenseLogged: "Matagumpay na na-log ang gastos.",
        invalidInput: "Maling Input",
        invalidInputMsg: "Mangyaring maglagay ng valid na positibong numero para sa presyo at puhunan.",
        invalidQuantity: "Maling Dami",
        invalidQuantityMsg: "Mangyaring maglagay ng valid na positibong numero.",
        notEnoughStock: "Kulang ang Stock",
        notEnoughStockMsg: "Hindi mabebenta ang",
        unitsOnly: "yunit.",
        available: "na lang ang available.",
        error: "Error",
        passwordEmpty: "Hindi pwedeng walang laman ang password.",
        resetComplete: "Kumpleto na ang Reset",
        resetCompleteMsg: "Na-clear na ang lahat ng datos.",
        authFailed: "Nabigo ang Authentication",
        loginFailed: "Nabigo ang pag-login",
        regFailed: "Nabigo ang pagpaparehistro",
        offlineMode: "☁️ Offline Mode: Ang mga pagbabago ay masi-sync kapag online na"
    },
    ceb: {
        welcomeBack: "Maayong pagbalik, Bantay!",
        startJourney: "Sugdi ang imong smart store journey",
        login: "Mag-login",
        createAccount: "Paghimo og Account",
        register: "Mag-rehistro",
        emailPlaceholder: "Email Address",
        passwordPlaceholder: "Password",
        noAccount: "Wala pay account? Mag-rehistro",
        hasAccount: "Naa nay account? Mag-login",
        posTab: "📦 POS",
        addTab: "➕ Dugang",
        dataTab: "📊 Datos",
        chatTab: "🤖 Chat",
        searchPlaceholder: "🔍 Pangitaa ang Produkto...",
        items: "MGA ITEM",
        stock: "STOCK",
        sell: "BALIGYA",
        add: "DUGANG",
        onlineMode: "Online Mode",
        darkMode: "Dark Mode",
        lightMode: "Light Mode",
        logout: "Mag-logout",
        language: "Pinulongan",
        productDetails: "Detalye sa Produkto",
        productName: "NGALAN SA PRODUKTO",
        initialStock: "SUGOD NGA STOCK",
        sellingPrice: "PRESYO SA BALIGYA",
        costPrice: "PUHUNAN",
        supplier: "SUPPLIER (OPSYONAL)",
        expiryDate: "PETSA SA PAG-EXPIRE (OPSYONAL)",
        addToInventory: "Idugang sa Imbentaryo",
        expenseDetails: "Detalye sa Gastos",
        description: "PAGHULAGWAY",
        amount: "KANTIDAD",
        logExpense: "I-log ang Gastos",
        newProduct: "Bag-ong Produkto",
        revenue: "Kita",
        expenses: "Gastos",
        netProfit: "Net nga Kita",
        unitsSold: "Unit nga Nahalin",
        lowStock: "Gamay na lang ang Stock",
        topSeller: "Kusog Mahalin",
        transactionHistory: "💸 Kasaysayan sa Transaksyon",
        aiSuggestions: "💡 Mga Suhestiyon sa Tindahan AI",
        salesTrend: "📈 Dagan sa Benta (Niaging 7 ka Adlaw)",
        topProductsShare: "🍰 Bahin sa Nag-unang Produkto",
        exportPdf: "🖨️ I-export ang PDF",
        resetData: "🗑️ I-reset ang Datos",
        last7Days: "Niaging 7 ka Adlaw",
        last30Days: "Niaging 30 ka Adlaw",
        filterByProduct: "I-filter pinaagi sa Produkto",
        showAllProducts: "Ipakita Tanan nga Produkto",
        tapPoint: "👆 I-tap ang punto para makita ang detalye",
        salesOn: "📅 Benta sa",
        noSales: "Walay natala nga benta.",
        bulkSell: "Daghan nga Baligya",
        bulkAdd: "Daghan nga Dugang",
        enterQuantity: "Isulod ang Gidaghanon:",
        confirm: "Kumpirmaha",
        cancel: "Kanselahon",
        save: "I-save",
        confirmDelete: "Kumpirmaha ug Papasa",
        enterPasswordConfirm: "Isulod ang Password para Kumpirmahon",
        securityMessage: "Para sa imong seguridad, isulod ang imong password aron papason ang tanang datos. Dili na kini mabalik.",
        aiNotificationSettings: "🔔 Mga Setting sa AI Notification",
        slowMoving: "Hinay Mahalin",
        fastMoving: "Paspas Mahalin",
        forecasts: "Pagtagna",
        askTips: "Pangayo og tips, status sa stock...",
        send: "Ipadala",
        editSellingPrice: "I-edit ang Presyo sa Baligya (₱):",
        editCostPrice: "I-edit ang Puhunan (₱):",
        supplierName: "Ngalan sa Supplier:",
        year: "Tuig",
        month: "Bulan",
        day: "Adlaw",
        productAnalytics: "📊 Analytics sa Produkto",
        totalUnitsSold: "📦 Kinatibuk-ang Nahalin:",
        estRevenue: "💰 Est. Kita:",
        currentStock: "📉 Kasamtangang Stock:",
        confirmLogout: "Kumpirmaha ang Pag-logout",
        logoutMessage: "Sigurado ka ba nga gusto kang mag-logout?",
        deleteProductTitle: "Papasa ang Produkto",
        deleteProductMsg: "Sigurado ka ba nga gusto nimong papason ang",
        thisCannotBeUndone: "Dili na kini mabalik.",
        outOfStock: "Wala nay Stock",
        outOfStockMsg: "Kini nga item wala nay stock.",
        validationError: "Error sa Validasyon",
        validationMsg: "Palihug isulod ang valid nga ngalan ug dili negatibo nga stock.",
        duplicateProduct: "Doble nga Produkto",
        duplicateMsg: "Aduna nay produkto nga adunay ingon niini nga ngalan. Gamita ang anaa na nga entry.",
        expenseLogged: "Malampuson nga na-log ang gastos.",
        invalidInput: "Sayop nga Input",
        invalidInputMsg: "Palihug isulod ang valid nga positibo nga numero para sa presyo ug puhunan.",
        invalidQuantity: "Sayop nga Gidaghanon",
        invalidQuantityMsg: "Palihug isulod ang valid nga positibo nga numero.",
        notEnoughStock: "Kulang ang Stock",
        notEnoughStockMsg: "Dili mabaligya ang",
        unitsOnly: "ka unit.",
        available: "na lang ang available.",
        error: "Error",
        passwordEmpty: "Dili pwede nga walay sulod ang password.",
        resetComplete: "Kompleto na ang Reset",
        resetCompleteMsg: "Na-clear na ang tanang datos.",
        authFailed: "Napakyas ang Authentication",
        loginFailed: "Napakyas ang pag-login",
        regFailed: "Napakyas ang pagparehistro",
        offlineMode: "☁️ Offline Mode: Ang mga kausaban ma-sync kung online na"
    }
};

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

        // Fetch Operational Expenses
        const expensesSnap = await getDocs(collection(db, 'users', userId, 'expenses'));
        const expenseList = expensesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        expenseList.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date (newest first)
        
        // Financial Calculation (Cash Flow Basis)
        let totalRevenue = 0;
        const transactionList = [];

        // 1. Process Sales (Revenue)
        salesData.forEach(sale => {
            const item = itemsMap[sale.itemId];
            if (item) {
                const amount = sale.qty * item.price;
                totalRevenue += amount;
                transactionList.push({
                    id: 'sale-' + Math.random(), // Unique ID for list
                    date: sale.date,
                    description: `Sold ${sale.qty} ${item.name}`,
                    amount: amount,
                    type: 'income'
                });
            }
        });

        // 2. Process Expenses (OpEx + Restocks)
        const totalExpenses = expenseList.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        
        expenseList.forEach(exp => {
            transactionList.push({
                id: exp.id,
                date: exp.date,
                description: exp.description,
                amount: -Number(exp.amount), // Negative for display
                type: 'expense'
            });
        });

        // 3. Merge and Sort Transactions
        transactionList.sort((a, b) => new Date(b.date) - new Date(a.date));

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
            transactionList, // Unified history list
            salesByItem: salesCount, // Expose per-item sales for details view
            restockSuggestions, // Expose detailed restock plan
            forecasts, // Expose forecasts for Chat/Settings
            salesDistribution, // For Pie Chart
            salesData, // Raw sales data for detailed charts
            itemsMap, // Item details for mapping
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
const AuthScreen = ({ email, setEmail, password, setPassword, authMode, setAuthMode, handleLogin, handleRegister, theme, language }) => {
    const t = translations[language];
    return (
        <View style={[styles.authContainer, { backgroundColor: theme.background }]}>
            <View style={[styles.authCard, { backgroundColor: theme.card }]}>
                <View style={{ marginBottom: 10 }}>
                    <Image source={require('../../assets/images/logo.png')} style={{ width: 220, height: 220 }} resizeMode="contain" />
                </View>
                
                <Text style={styles.authSubtitle}>
                    {authMode === 'login' ? t.welcomeBack : t.startJourney}
                </Text>

                <View style={styles.authInputContainer}>
                    <MaterialIcons name="email" size={20} color="#aaa" style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder={t.emailPlaceholder}
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
                        placeholder={t.passwordPlaceholder}
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
                        {authMode === 'login' ? t.login : t.createAccount}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    onPress={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                    style={{ marginTop: 20 }}
                >
                    <Text style={{ color: colors.accent, fontWeight: '600' }}>
                        {authMode === 'login' ? t.noAccount : t.hasAccount}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 2. Product Card Component for FlatList
const ProductCard = ({ item, sellItem, addItem, deleteProduct, onOpenDetails, theme, onBulkAction, language }) => {
    const t = translations[language];
    const displayStock = item.stock || 0;
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
                        <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                            Cost: ₱{item.cost ? Number(item.cost).toFixed(2) : '0.00'}
                        </Text>
                        {item.expiryDate ? (
                            <Text style={{ fontSize: 12, color: '#d9534f', marginTop: 4, fontWeight: '600' }}>Exp: {item.expiryDate}</Text>
                        ) : null}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <TouchableOpacity onPress={() => deleteProduct(item.id)} style={{ marginBottom: 10, padding: 4 }}>
                            <MaterialIcons name="delete-outline" size={22} color="#ccc" />
                        </TouchableOpacity>
                        <Text style={{ fontSize: 11, color: '#999', textTransform: 'uppercase', marginBottom: 2, fontWeight: '600' }}>{t.stock}</Text>
                        <Text style={{ fontSize: 22, fontWeight: '800', color: isLowStock ? colors.danger : colors.primary }}>
                            {displayStock}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Main POS Actions */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: displayStock > 0 ? colors.danger : '#e0e0e0', flex: 2 }]}
                    onPress={() => displayStock > 0 ? sellItem(item.id) : Alert.alert(t.outOfStock, t.outOfStockMsg)}
                    disabled={displayStock <= 0}
                    onLongPress={() => displayStock > 0 ? onBulkAction(item, 'sell') : null}
                    delayLongPress={1000}
                >
                    <MaterialIcons name="shopping-cart" size={22} color={displayStock > 0 ? "white" : "#999"} style={{ marginRight: 8 }} />
                    <Text style={[styles.actionButtonText, { color: displayStock > 0 ? "white" : "#999" }]}>{t.sell}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
                    onPress={() => addItem(item.id)}
                    onLongPress={() => onBulkAction(item, 'add')}
                    delayLongPress={1000}
                >
                    <MaterialIcons name="add-box" size={22} color="white" style={{ marginRight: 6 }} />
                    <Text style={styles.actionButtonText}>{t.add}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// 2.6 AI Chat & Settings Screen
const AIChatScreen = ({ analytics, aiSettings, setAiSettings, chatMessages, setChatMessages, theme, language }) => {
    const t = translations[language];
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
                <Text style={{ fontWeight: 'bold', color: colors.primary, marginBottom: 10 }}>{t.aiNotificationSettings}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 5 }}>
                        <Switch value={aiSettings.lowStock} onValueChange={() => toggleSetting('lowStock')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>{t.lowStock}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: 5 }}>
                        <Switch value={aiSettings.slowMoving} onValueChange={() => toggleSetting('slowMoving')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>{t.slowMoving}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%' }}>
                        <Switch value={aiSettings.fastMoving} onValueChange={() => toggleSetting('fastMoving')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>{t.fastMoving}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', width: '48%' }}>
                        <Switch value={aiSettings.forecasts} onValueChange={() => toggleSetting('forecasts')} trackColor={{true: colors.primary}} thumbColor={Platform.OS === 'android' ? '#f4f3f4' : ''} />
                        <Text style={{ fontSize: 12, marginLeft: 5, color: theme.text }}>{t.forecasts}</Text>
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
                        placeholder={t.askTips}
                        placeholderTextColor="#888"
                        value={inputText}
                        onChangeText={setInputText}
                    />
                    <Button title={t.send} onPress={handleSend} color={colors.primary} />
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

// 2.5 Product Details Modal
const ProductDetailsModal = ({ visible, onClose, product, salesData, onSaveDetails, theme, language }) => {
    const t = translations[language];
    const [price, setPrice] = useState('');
    const [cost, setCost] = useState('');
    const [supplier, setSupplier] = useState('');
    const [expYear, setExpYear] = useState('');
    const [expMonth, setExpMonth] = useState('');
    const [expDay, setExpDay] = useState('');

    useEffect(() => {
        if (product) {
            setPrice(product.price !== undefined ? String(product.price) : '');
            setCost(product.cost !== undefined ? String(product.cost) : '');
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
        onSaveDetails(product.id, price, cost, supplier, formattedExpiry);
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
                    
                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.editSellingPrice}</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                        value={price} 
                        onChangeText={setPrice} 
                        keyboardType="numeric" 
                    />

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.editCostPrice}</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                        value={cost} 
                        onChangeText={setCost} 
                        keyboardType="numeric" 
                    />

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.supplierName}</Text>
                    <TextInput 
                        style={[styles.input, { marginBottom: 15, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]} 
                        value={supplier} 
                        onChangeText={setSupplier} 
                        placeholder="e.g., ABC Wholesaler"
                        placeholderTextColor="#888"
                    />

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.expiryDate}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                        <View style={{ width: '30%' }}>
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.year}</Text>
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
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.month}</Text>
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
                            <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.day}</Text>
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
                        <Text style={{ fontWeight: 'bold', marginBottom: 5, fontSize: 16 }}>{t.productAnalytics}</Text>
                        <Text style={{ color: theme.text }}>{t.totalUnitsSold} <Text style={{ fontWeight: 'bold' }}>{totalSold}</Text></Text>
                        <Text style={{ color: theme.text }}>{t.estRevenue} <Text style={{ fontWeight: 'bold', color: colors.primary }}>₱{revenue.toFixed(2)}</Text></Text>
                        <Text style={{ color: theme.text }}>{t.currentStock} <Text style={{ fontWeight: 'bold' }}>{product.stock}</Text></Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ width: '45%' }}><Button title={t.cancel} onPress={onClose} color="#888" /></View>
                        <View style={{ width: '45%' }}><Button title={t.save} onPress={handleSave} color={colors.primary} /></View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// 2.7 Stat Details Modal (New Component)
const StatDetailsModal = ({ visible, onClose, type, analytics, theme, language }) => {
    const t = translations[language];
    const [filter, setFilter] = useState('7d'); // '7d' | '30d'
    const [selectedProductId, setSelectedProductId] = useState('all');
    const [breakdown, setBreakdown] = useState(null); // Store clicked day's data
    const screenWidth = Dimensions.get('window').width - 60;

    useEffect(() => {
        // Reset filters when modal becomes visible for a new stat type
        if (visible) {
            setFilter('7d');
            setSelectedProductId('all');
            setBreakdown(null);
        }
    }, [visible, type]);

    if (!visible || !analytics) return null;

    const getTitle = () => {
        switch (type) {
            case 'revenue': return `💰 ${t.revenue}`;
            case 'expenses': return `💸 ${t.expenses}`;
            case 'units': return `📦 ${t.unitsSold}`;
            case 'lowStock': return `⚠️ ${t.lowStock}`;
            case 'topItem': return `🏆 ${t.topSeller}`;
            case 'profit': return `📈 ${t.netProfit}`;
            default: return 'Details';
        }
    };

    const processChartData = () => {
        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - (filter === '7d' ? 7 : 30));

        if (type === 'topItem') {
            // Special handling for Top Items (Bar Chart)
            const itemCounts = {};
            analytics.salesData.forEach(sale => {
                const date = new Date(sale.date);
                if (date >= pastDate) {
                    const item = analytics.itemsMap[sale.itemId];
                    if (item) {
                        itemCounts[item.name] = (itemCounts[item.name] || 0) + sale.qty;
                    }
                }
            });
            const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
            return {
                labels: sorted.map(i => {
                    const name = i[0];
                    return name.length > 10 ? name.substring(0, 10) + '...' : name;
                }),
                datasets: [{ data: sorted.map(i => i[1]) }]
            };
        }

        const labels = [];
        const dataPoints = [];
        const fullDates = [];

        // Initialize dates
        for (let d = new Date(pastDate); d <= now; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            fullDates.push(dateStr);
            
            const label = filter === '7d' ? dateStr.slice(5) : dateStr.slice(8); // MM-DD or DD
            // Sparse labels for 30d view to prevent overlapping
            if (filter === '30d' && fullDates.length % 4 !== 0) {
                labels.push('');
            } else {
                labels.push(label);
            }

            let value = 0;
            if (type === 'revenue' || type === 'units') {
                analytics.salesData.forEach(sale => {
                    if (sale.date?.startsWith(dateStr)) {
                        if (type === 'revenue') {
                            const price = analytics.itemsMap[sale.itemId]?.price || 0;
                            value += sale.qty * price;
                        } else { // units
                            if (selectedProductId === 'all' || sale.itemId === selectedProductId) {
                                value += sale.qty;
                            }
                        }
                    }
                });
            } else if (type === 'expenses') {
                analytics.transactionList.forEach(t => {
                    if (t.type === 'expense' && t.date?.startsWith(dateStr)) {
                        value += Math.abs(t.amount); // Use absolute value since it's stored as negative
                    }
                })
            }
            dataPoints.push(value);
        }

        return {
            labels,
            datasets: [{ data: dataPoints }],
            fullDates
        };
    };

    const chartData = processChartData();

    const ChartConfig = {
        backgroundColor: theme.card,
        backgroundGradientFrom: theme.card,
        backgroundGradientTo: theme.background,
        decimalPlaces: 0,
        color: (opacity = 1) => type === 'expenses' ? `rgba(220, 53, 69, ${opacity})` : `rgba(34, 139, 34, ${opacity})`,
        labelColor: (opacity = 1) => theme.text === '#e0e0e0' ? `rgba(255,255,255,${opacity})` : `rgba(0,0,0,${opacity})`,
        barPercentage: 0.7,
    };

    const handleDataPointClick = ({ index, value }) => {
        if (!chartData.fullDates || !chartData.fullDates[index]) return;
        const date = chartData.fullDates[index];
        
        // Aggregate items for this date
        const dailySales = {};
        analytics.salesData.forEach(sale => {
            if (sale.date.startsWith(date)) {
                const name = analytics.itemsMap[sale.itemId]?.name || 'Unknown';
                dailySales[name] = (dailySales[name] || 0) + sale.qty;
            }
        });
        const itemsList = Object.entries(dailySales).map(([name, qty]) => ({ name, qty }));
        setBreakdown({ date, items: itemsList, total: value });
    };

    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card, width: '95%', maxHeight: '80%' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <Text style={[styles.modalTitle, { marginBottom: 0, color: theme.text }]}>{getTitle()}</Text>
                        <TouchableOpacity onPress={onClose}><MaterialIcons name="close" size={24} color={theme.text} /></TouchableOpacity>
                    </View>

                    {type !== 'lowStock' && (
                        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 15 }}>
                            <TouchableOpacity onPress={() => setFilter('7d')} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: filter === '7d' ? colors.primary : theme.background, borderRadius: 20, marginRight: 10, minWidth: 100, alignItems: 'center' }}>
                                <Text style={{ color: filter === '7d' ? 'white' : theme.text, fontWeight: 'bold' }}>{t.last7Days}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => setFilter('30d')} style={{ paddingVertical: 6, paddingHorizontal: 12, backgroundColor: filter === '30d' ? colors.primary : theme.background, borderRadius: 20, minWidth: 100, alignItems: 'center' }}>
                                <Text style={{ color: filter === '30d' ? 'white' : theme.text, fontWeight: 'bold' }}>{t.last30Days}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {type === 'units' && (
                        <View style={{ marginHorizontal: 10, marginBottom: 15, borderWidth: 1, borderColor: theme.background === '#121212' ? '#444' : '#ccc', borderRadius: 8 }}>
                            <Text style={{ position: 'absolute', top: -10, left: 10, backgroundColor: theme.card, paddingHorizontal: 5, fontSize: 12, color: theme.text }}>{t.filterByProduct}</Text>
                            <Picker
                                selectedValue={selectedProductId}
                                onValueChange={(itemValue) => setSelectedProductId(itemValue)}
                                style={{ color: theme.text }}
                                dropdownIconColor={theme.text}
                                itemStyle={{ color: theme.text }}
                            >
                                <Picker.Item label={t.showAllProducts} value="all" />
                                {Object.entries(analytics.itemsMap)
                                    .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                                    .map(([id, item]) => (
                                        <Picker.Item key={id} label={item.name} value={id} />
                                    ))}
                            </Picker>
                        </View>
                    )}

                    {type === 'lowStock' ? (
                        <ScrollView>
                            {analytics.lowStock && analytics.lowStock.length > 0 ? (
                                analytics.lowStock.map((name, index) => (
                                    <View key={index} style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                                        <Text style={{ fontSize: 16, color: theme.text }}>⚠️ {name}</Text>
                                    </View>
                                ))
                            ) : <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>No low stock items.</Text>}
                        </ScrollView>
                    ) : (
                        <ScrollView horizontal>
                            {type === 'topItem' ? (
                                <BarChart data={chartData} width={screenWidth + 40} height={250} chartConfig={ChartConfig} yAxisLabel="" yAxisSuffix="" fromZero showValuesOnTopOfBars verticalLabelRotation={30} />
                            ) : (
                                <View>
                                    <LineChart 
                                        data={chartData} 
                                        width={screenWidth + 40} 
                                        height={250} 
                                        chartConfig={ChartConfig} 
                                        bezier 
                                        onDataPointClick={handleDataPointClick}
                                    />
                                    <Text style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 5 }}>{t.tapPoint}</Text>
                                </View>
                            )}
                        </ScrollView>
                    )}

                    {breakdown && (
                        <View style={{ marginTop: 15, padding: 15, backgroundColor: theme.background, borderRadius: 8, maxHeight: 150 }}>
                            <Text style={{ fontWeight: 'bold', color: theme.text, marginBottom: 8, fontSize: 16 }}>{t.salesOn} {breakdown.date}</Text>
                            <ScrollView nestedScrollEnabled>
                                {breakdown.items.length > 0 ? breakdown.items.map((item, idx) => (
                                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <Text style={{ color: theme.text }}>{item.name}</Text>
                                        <Text style={{ fontWeight: 'bold', color: theme.text }}>x{item.qty}</Text>
                                    </View>
                                )) : <Text style={{ color: '#888' }}>{t.noSales}</Text>}
                            </ScrollView>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

// 2.8 Bulk Action Modal (New Component)
const BulkActionModal = ({ visible, onClose, onConfirm, actionType, itemName, qty, setQty, theme, language }) => {
    const t = translations[language];
    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card, width: '85%' }]}>
                    <Text style={[styles.modalTitle, { color: actionType === 'sell' ? colors.danger : colors.primary }]}>
                        {actionType === 'sell' ? t.bulkSell : t.bulkAdd}
                    </Text>
                    <Text style={{ textAlign: 'center', marginBottom: 15, color: theme.text, fontSize: 16 }}>
                        {itemName}
                    </Text>

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.enterQuantity}</Text>
                    <TextInput
                        style={[styles.input, { marginBottom: 20, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc', textAlign: 'center', fontSize: 24, height: 60 }]}
                        value={qty}
                        onChangeText={setQty}
                        keyboardType="numeric"
                        autoFocus={true}
                        placeholder="0"
                        placeholderTextColor="#888"
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ width: '45%' }}><Button title={t.cancel} onPress={onClose} color="#888" /></View>
                        <View style={{ width: '45%' }}>
                            <Button title={t.confirm} onPress={onConfirm} color={actionType === 'sell' ? colors.danger : colors.primary} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// 2.9 Password Confirmation Modal (New Component)
const PasswordConfirmModal = ({ visible, onClose, onConfirm, password, setPassword, theme, language }) => {
    const t = translations[language];
    return (
        <Modal visible={visible} animationType="fade" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: theme.card, width: '85%' }]}>
                    <Text style={[styles.modalTitle, { color: colors.danger }]}>
                        {t.enterPasswordConfirm}
                    </Text>
                    <Text style={{ textAlign: 'center', marginBottom: 15, color: theme.text, fontSize: 14 }}>
                        {t.securityMessage}
                    </Text>

                    <Text style={{ marginBottom: 5, fontWeight: 'bold', color: theme.text }}>{t.passwordPlaceholder}:</Text>
                    <TextInput
                        style={[styles.input, { marginBottom: 20, backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoFocus={true}
                        autoCapitalize="none"
                        placeholder="Your account password"
                        placeholderTextColor="#888"
                    />

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ width: '45%' }}><Button title={t.cancel} onPress={onClose} color="#888" /></View>
                        <View style={{ width: '45%' }}>
                            <Button title={t.confirmDelete} onPress={onConfirm} color={colors.danger} />
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// 3. Analytics Dashboard Screen
const AnalyticsScreen = ({ analytics, salesHistory, profitHistory, aiSettings, theme, onResetPress, language }) => {
    const t = translations[language];
    const [selectedStat, setSelectedStat] = useState(null);
    const screenWidth = Dimensions.get('window').width - 40;
    const chartWidth = Math.max(screenWidth, salesHistory.labels.length * 50);
    
    const [showExpenses, setShowExpenses] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [historyFilter, setHistoryFilter] = useState('7d'); // '7d' | '30d'
    const [visibleHistoryCount, setVisibleHistoryCount] = useState(11);

    useEffect(() => {
        setVisibleHistoryCount(11); // Reset on filter change
    }, [historyFilter]);

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
        <TouchableOpacity onPress={() => setSelectedStat(item.type)} style={[styles.statCard, { borderTopWidth: 4, borderTopColor: item.color, backgroundColor: theme.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ backgroundColor: item.color + '15', padding: 8, borderRadius: 50 }}>
                    <MaterialIcons name={item.icon} size={24} color={item.color} />
                </View>
            </View>
            <View>
                <Text style={[styles.statValue, { color: theme.text }]} numberOfLines={1}>{item.value}</Text>
                <Text style={[styles.statTitle, { color: theme.text === '#e0e0e0' ? '#aaa' : '#666' }]}>{item.title}</Text>
            </View>
        </TouchableOpacity>
    );
    
    if (!analytics) return <Text style={{ padding: 20, textAlign: 'center' }}>Loading analytics...</Text>;

    // Filter History List
    const getFilteredHistory = () => {
        if (!analytics.transactionList) return [];
        const now = new Date();
        const pastDate = new Date();
        pastDate.setDate(now.getDate() - (historyFilter === '7d' ? 7 : 30));
        
        return analytics.transactionList.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= pastDate && itemDate <= now;
        });
    };
    const filteredHistory = getFilteredHistory();

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

                    <h2>💸 Transaction History</h2>
                    <div style="background-color: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 10px;">
                        ${analytics.transactionList && analytics.transactionList.length > 0 ? 
                            analytics.transactionList.slice(0, 50).map(t => `
                                <div class="list-item" style="display: flex; justify-content: space-between;">
                                    <span>${new Date(t.date).toLocaleDateString()} - ${t.description}</span>
                                    <span style="color: ${t.type === 'income' ? '#228B22' : '#dc3545'}; font-weight: bold;">${t.type === 'income' ? '+' : ''}₱${Math.abs(t.amount).toFixed(2)}</span>
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
    const renderCollapsibleSection = (title, isOpen, toggle, content, titleColor = theme.text) => (
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
            <View style={{ margin: 16, marginBottom: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <Button title={t.exportPdf} onPress={printAnalytics} color={colors.accent} />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Button title={t.resetData} onPress={onResetPress} color={colors.danger} />
                </View>
            </View>

            {/* Stats Grid */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, marginTop: 10 }}>
                {[
                    { title: t.revenue, value: `₱${analytics.totalRevenue}`, icon: "attach-money", color: colors.primary, type: 'revenue' },
                    { title: t.expenses, value: `₱${analytics.totalExpenses}`, icon: "money-off", color: colors.danger, type: 'expenses' },
                    { title: t.netProfit, value: `₱${analytics.netProfit}`, icon: "trending-up", color: parseFloat(analytics.netProfit) >= 0 ? colors.primary : colors.danger, type: 'profit' },
                    { title: t.unitsSold, value: analytics.totalSales, icon: "shopping-cart", color: colors.accent, type: 'units' },
                    { title: t.lowStock, value: analytics.lowStock?.length || 0, icon: "warning", color: analytics.lowStock?.length > 0 ? colors.danger : colors.primary, type: 'lowStock' },
                    { title: t.topSeller, value: analytics.top3?.[0] || 'N/A', icon: "star", color: "#FFD700", type: 'topItem' }
                ].map((stat, index) => (
                    <View key={index} style={{ width: '50%', padding: 6 }}>
                        {renderStatCard(stat)}
                    </View>
                ))}
            </View>

            {/* Transaction History List */}
            {renderCollapsibleSection(
                t.transactionHistory,
                showExpenses,
                () => setShowExpenses(!showExpenses),
                <View>
                    {/* Date Filter */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
                        <TouchableOpacity onPress={() => setHistoryFilter('7d')} style={{ paddingVertical: 4, paddingHorizontal: 12, backgroundColor: historyFilter === '7d' ? colors.primary : theme.background, borderRadius: 15, marginRight: 8, minWidth: 100, alignItems: 'center' }}>
                            <Text style={{ color: historyFilter === '7d' ? 'white' : theme.text, fontSize: 12, fontWeight: 'bold' }}>{t.last7Days}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setHistoryFilter('30d')} style={{ paddingVertical: 4, paddingHorizontal: 12, backgroundColor: historyFilter === '30d' ? colors.primary : theme.background, borderRadius: 15, minWidth: 100, alignItems: 'center' }}>
                            <Text style={{ color: historyFilter === '30d' ? 'white' : theme.text, fontSize: 12, fontWeight: 'bold' }}>{t.last30Days}</Text>
                        </TouchableOpacity>
                    </View>

                    {filteredHistory.length > 0 ? (
                    <FlatList
                        data={filteredHistory.slice(0, visibleHistoryCount)}
                        keyExtractor={(item, index) => item.id + '-' + index}
                        renderItem={({ item }) => (
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                                <View>
                                    <Text style={{ fontWeight: 'bold', color: theme.text, maxWidth: 200 }} numberOfLines={1}>{item.description}</Text>
                                    <Text style={{ fontSize: 12, color: theme.text === '#e0e0e0' ? '#aaa' : '#888' }}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                </View>
                                <Text style={{ fontWeight: 'bold', color: item.type === 'income' ? colors.primary : colors.danger }}>{item.type === 'income' ? '+' : ''}₱{Math.abs(item.amount).toFixed(2)}</Text>
                            </View>
                        )}
                        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: theme.background === '#121212' ? '#333' : '#eee' }} />}
                        onEndReached={() => {
                            if (visibleHistoryCount < filteredHistory.length) {
                                setVisibleHistoryCount(prev => prev + 11);
                            }
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={() => {
                            if (visibleHistoryCount < filteredHistory.length) {
                                return <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 10 }} />;
                            }
                            return null;
                        }}
                        style={{ maxHeight: 400 }} // To make it scrollable within the ScrollView
                    />
                    ) : <Text style={{ color: theme.text === '#e0e0e0' ? '#aaa' : '#666', fontStyle: 'italic', textAlign: 'center', marginVertical: 10 }}>{t.noSales}</Text>}
                </View>
            )}

            {/* AI Recommendations */}
            {renderCollapsibleSection(
                t.aiSuggestions,
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
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>{t.salesTrend}</Text>
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
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: theme.text }}>{t.topProductsShare}</Text>
                    <PieChart
                        data={analytics.salesDistribution}
                        width={screenWidth - 40}
                        height={200}
                        chartConfig={ChartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                    />
                </View>
            )}

            {/* Stat Details Modal */}
            <StatDetailsModal 
                visible={!!selectedStat} 
                onClose={() => setSelectedStat(null)} 
                type={selectedStat} 
                analytics={analytics} 
                theme={theme} 
                language={language}
            />
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
    theme,
    language
}) => {
    const t = translations[language];
    const [mode, setMode] = useState('product'); // 'product' | 'expense'

    return (
        <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* Toggle Switch */}
            <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: theme.background === '#121212' ? '#333' : '#e0e0e0', borderRadius: 12, padding: 4 }}>
                <TouchableOpacity 
                    onPress={() => setMode('product')}
                    style={{ flex: 1, paddingVertical: 10, backgroundColor: mode === 'product' ? theme.card : 'transparent', borderRadius: 10, alignItems: 'center', elevation: mode === 'product' ? 2 : 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }}
                >
                    <Text style={{ fontWeight: 'bold', color: mode === 'product' ? colors.primary : '#888' }}>{t.newProduct}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => setMode('expense')}
                    style={{ flex: 1, paddingVertical: 10, backgroundColor: mode === 'expense' ? theme.card : 'transparent', borderRadius: 10, alignItems: 'center', elevation: mode === 'expense' ? 2 : 0, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 1 }}
                >
                    <Text style={{ fontWeight: 'bold', color: mode === 'expense' ? colors.danger : '#888' }}>{t.logExpense}</Text>
                </TouchableOpacity>
            </View>
            
            <View style={[styles.sectionCard, { marginHorizontal: 0, padding: 20, backgroundColor: theme.card }]}>
                {mode === 'product' ? (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ backgroundColor: colors.primary + '15', padding: 10, borderRadius: 50, marginRight: 10 }}>
                                <MaterialIcons name="inventory" size={24} color={colors.primary} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{t.productDetails}</Text>
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.productName}</Text>
                            <TextInput
                                value={newProductName}
                                onChangeText={setNewProductName}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. C2 Green Tea"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.initialStock}</Text>
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
                                <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.sellingPrice}</Text>
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
                                <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.costPrice}</Text>
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
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.supplier}</Text>
                            <TextInput
                                value={newProductSupplier}
                                onChangeText={setNewProductSupplier}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. ABC Wholesaler"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.expiryDate}</Text>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <View style={{ width: '30%' }}>
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.year}</Text>
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
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.month}</Text>
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
                                    <Text style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{t.day}</Text>
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
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{t.addToInventory}</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
                            <View style={{ backgroundColor: colors.danger + '15', padding: 10, borderRadius: 50, marginRight: 10 }}>
                                <MaterialIcons name="receipt-long" size={24} color={colors.danger} />
                            </View>
                            <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.text }}>{t.expenseDetails}</Text>
                        </View>
                        
                        <View style={{ marginBottom: 15 }}>
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.description}</Text>
                            <TextInput
                                value={expenseDescription}
                                onChangeText={setExpenseDescription}
                                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.background === '#121212' ? '#333' : '#ccc' }]}
                                placeholder="e.g. Electricity Bill"
                                placeholderTextColor="#888"
                            />
                        </View>

                        <View style={{ marginBottom: 20 }}>
                            <Text style={{ fontSize: 12, color: theme.text, marginBottom: 5, fontWeight: '600' }}>{t.amount}</Text>
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
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>{t.logExpense}</Text>
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
    const [isOffline, setIsOffline] = useState(false);
    const [networkEnabled, setNetworkEnabled] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [language, setLanguage] = useState('en');

    const theme = isDarkMode ? darkColors : colors;
    const t = translations[language];
    
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

    // Bulk Action State
    const [bulkAction, setBulkAction] = useState(null); // { item, type }
    const [bulkQty, setBulkQty] = useState('');

    const [isMenuVisible, setIsMenuVisible] = useState(false);
    // Reset Modal State
    const [isResetModalVisible, setIsResetModalVisible] = useState(false);
    const [resetPassword, setResetPassword] = useState('');

    // Expense State
    const [expenseDescription, setExpenseDescription] = useState('');
    const [expenseAmount, setExpenseAmount] = useState('');
    const [refreshTrigger, setRefreshTrigger] = useState(0); // To trigger analytics reload

    const filteredItems = (search.trim()
        ? items.filter(item =>
            item.name.toLowerCase().includes(search.trim().toLowerCase())
        )
        : items).sort((a, b) => a.name.localeCompare(b.name));

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
    }, [user, refreshTrigger]);
    
    // --- Handlers ---

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setEmail('');
            setPassword('');
        } catch (e) {
            Alert.alert(t.loginFailed, e.message);
        }
    };

    const handleRegister = async () => {
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setEmail('');
            setPassword('');
        } catch (e) {
            Alert.alert(t.regFailed, e.message);
        }
    };

    const handleLogout = () => {
        Alert.alert(
            t.confirmLogout,
            t.logoutMessage,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: async () => await signOut(auth) }
            ]
        );
    };

    const handleOpenResetModal = () => {
        setResetPassword('');
        setIsResetModalVisible(true);
    };

    const handleConfirmReset = async () => {
        if (!auth.currentUser || !resetPassword) {
            Alert.alert(t.error, t.passwordEmpty);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(auth.currentUser.email, resetPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Re-auth successful, proceed with deletion
            const deleteColl = async (path) => {
                const snap = await getDocs(collection(db, 'users', user.uid, path));
                await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
            };
            await Promise.all([deleteColl('items'), deleteColl('sales'), deleteColl('expenses')]);
            
            setIsResetModalVisible(false);
            setResetPassword('');
            setRefreshTrigger(prev => prev + 1);
            Alert.alert(t.resetComplete, t.resetCompleteMsg);

        } catch (e) {
            Alert.alert(t.authFailed, e.message);
            console.error("Re-authentication failed:", e);
        }
    };

    const sellItem = async (id) => {
        if (!user) return;
        const item = items.find(i => i.id === id);
        if (!item || item.stock <= 0) {
            Alert.alert(t.outOfStock, t.outOfStockMsg);
            return;
        }

        const newStock = (item.stock || 0) - 1;
        
        // Optimistically update UI, but Firestore is the source of truth
        setItems(prevItems =>
            prevItems.map(i => (i.id === id ? { ...i, stock: newStock } : i))
        );

        await saveItemToCloud(user.uid, { ...item, stock: newStock });
        await logSaleToCloud(user.uid, id, 1);
        setRefreshTrigger(prev => prev + 1); // Force Analytics Refresh
    };

    const addItem = async (id) => {
        if (!user) return;
        const item = items.find(i => i.id === id);
        if (!item) return;

        const newStock = (item.stock || 0) + 1;

        // Optimistic UI update
        setItems(prevItems =>
            prevItems.map(i => (i.id === id ? { ...i, stock: newStock } : i))
        );

        await saveItemToCloud(user.uid, { ...item, stock: newStock });

        // Log Expense for the restock
        const cost = item.cost ? Number(item.cost) : 15; // Default to 15 if missing, matching analytics
        if (cost > 0) {
            await addDoc(collection(db, 'users', user.uid, 'expenses'), {
                description: `Restock: ${item.name} (+1)`,
                amount: cost,
                date: new Date().toISOString()
            });
        }
        
        setRefreshTrigger(prev => prev + 1); // Force Analytics Refresh
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
            Alert.alert(t.validationError, t.validationMsg);
            return;
        }

        // Check for duplicates before adding
        const duplicate = items.some(item => item.name.trim().toLowerCase() === name.toLowerCase());
        if (duplicate) {
            Alert.alert(t.duplicateProduct, t.duplicateMsg);
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

        // Log Initial Stock Expense
        const initialCost = stock * cost;
        if (initialCost > 0) {
            await addDoc(collection(db, 'users', user.uid, 'expenses'), {
                description: `Initial Stock: ${name}`,
                amount: initialCost,
                date: new Date().toISOString()
            });
        }

        setRefreshTrigger(prev => prev + 1); // Force Analytics Refresh (to catch initial expense)
    };

    const addExpense = async () => {
        if (!user) return;
        const amount = parseFloat(expenseAmount);
        if (!expenseDescription.trim() || isNaN(amount) || amount < 0) {
            Alert.alert(t.validationError, 'Please enter a valid description and amount.');
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
        Alert.alert('Success', t.expenseLogged);
    };

    const deleteProduct = (id) => {
        const product = items.find(item => item.id === id);
        Alert.alert(
            t.deleteProductTitle,
            `${t.deleteProductMsg} "${product?.name}"? ${t.thisCannotBeUndone}`,
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
    
    const handleSaveDetails = async (id, newPrice, newCost, newSupplier, newExpiry) => {
        if (!user) return;
        const priceNum = parseFloat(newPrice);
        const costNum = parseFloat(newCost);
        if (isNaN(priceNum) || priceNum < 0 || isNaN(costNum) || costNum < 0) {
            Alert.alert(t.invalidInput, t.invalidInputMsg);
            return;
        }
        setItems(prev => prev.map(item => item.id === id ? { ...item, price: priceNum, cost: costNum, supplier: newSupplier, expiryDate: newExpiry } : item));
        await updateItemDetailsInCloud(user.uid, id, { price: priceNum, cost: costNum, supplier: newSupplier, expiryDate: newExpiry });
    };

    const handleBulkAction = (item, type) => {
        setBulkAction({ item, type });
        setBulkQty('');
    };

    const confirmBulkAction = async () => {
        if (!bulkAction || !user) return;
        const qty = parseInt(bulkQty, 10);

        if (isNaN(qty) || qty <= 0) {
            Alert.alert(t.invalidQuantity, t.invalidQuantityMsg);
            return;
        }

        const { item, type } = bulkAction;

        if (type === 'sell') {
            if (item.stock < qty) {
                Alert.alert(t.notEnoughStock, `${t.notEnoughStockMsg} ${qty} ${t.unitsOnly} ${item.stock} ${t.available}`);
                return;
            }
            const newStock = (item.stock || 0) - qty;
            
            setItems(prevItems => prevItems.map(i => (i.id === item.id ? { ...i, stock: newStock } : i)));
            await saveItemToCloud(user.uid, { ...item, stock: newStock });
            await logSaleToCloud(user.uid, item.id, qty);

        } else { // type === 'add'
            const newStock = (item.stock || 0) + qty;

            setItems(prevItems => prevItems.map(i => (i.id === item.id ? { ...i, stock: newStock } : i)));
            await saveItemToCloud(user.uid, { ...item, stock: newStock });

            const cost = qty * (item.cost ? Number(item.cost) : 15); // Default to 15 if missing
            if (cost > 0) {
                await addDoc(collection(db, 'users', user.uid, 'expenses'), {
                    description: `Restock: ${item.name} (+${qty})`,
                    amount: cost,
                    date: new Date().toISOString()
                });
            }
        }

        setRefreshTrigger(prev => prev + 1);
        setBulkAction(null);
        setBulkQty('');
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
        return <AuthScreen {...{ email, setEmail, password, setPassword, authMode, setAuthMode, handleLogin, handleRegister, theme, language }} />;
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
                    theme,
                    language
                }} />;
            case 'analytics':
                return <AnalyticsScreen analytics={analytics} salesHistory={salesHistory} profitHistory={profitHistory} aiSettings={aiSettings} theme={theme} onResetPress={handleOpenResetModal} language={language} />;
            case 'chat':
                return <AIChatScreen analytics={analytics} aiSettings={aiSettings} setAiSettings={setAiSettings} chatMessages={chatMessages} setChatMessages={setChatMessages} theme={theme} language={language} />;
            case 'inventory':
            default:
                return (
                    <View style={{ flex: 1, backgroundColor: theme.background }}>
                        {/* Search and Summary */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.background }}>
                            <TextInput
                                placeholder={t.searchPlaceholder}
                                placeholderTextColor="#888"
                                value={search}
                                onChangeText={setSearch}
                                style={[styles.input, { flex: 1, marginRight: 12, backgroundColor: theme.card, color: theme.text, borderWidth: 0, elevation: 1 }]}
                            />
                            <View style={{ alignItems: 'flex-end', opacity: 0.8 }}>
                                <Text style={{ fontSize: 11, color: theme.text }}>{t.items}: <Text style={{ fontWeight: 'bold' }}>{totalItems}</Text></Text>
                                <Text style={{ fontSize: 11, color: theme.text }}>{t.stock}: <Text style={{ fontWeight: 'bold' }}>{totalStock}</Text></Text>
                            </View>
                        </View>
                        
                        {/* Product List */}
                        <FlatList
                            data={filteredItems}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <ProductCard 
                                    item={item}
                                    sellItem={sellItem}
                                    addItem={addItem}
                                    deleteProduct={deleteProduct}
                                    onOpenDetails={handleOpenDetails}
                                    theme={theme}
                                    onBulkAction={handleBulkAction}
                                    language={language}
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
                        {tab === 'inventory' ? t.posTab : tab === 'add' ? t.addTab : tab === 'analytics' ? t.dataTab : t.chatTab}
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
                        <Image source={require('../../assets/images/logo.png')} style={{ width: 40, height: 40, marginRight: 8 }} resizeMode="contain" />
                        <Text style={[styles.title, { marginBottom: 0 }]}>
                            BantayTindahan <Text style={{ color: '#29b6f6' }}>AI</Text>
                        </Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsMenuVisible(true)} style={{ padding: 8 }}>
                        <MaterialIcons name="menu" size={30} color={theme.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Hamburger Menu Modal */}
            <Modal
                visible={isMenuVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsMenuVisible(false)}
            >
                <TouchableOpacity 
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.1)' }} 
                    activeOpacity={1} 
                    onPress={() => setIsMenuVisible(false)}
                >
                    <View style={{ 
                        position: 'absolute', 
                        top: 55, 
                        right: 15, 
                        backgroundColor: theme.card, 
                        borderRadius: 12, 
                        padding: 15, 
                        elevation: 10,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4.65,
                        minWidth: 220,
                        borderWidth: 1,
                        borderColor: theme.background === '#121212' ? '#333' : '#eee'
                    }}>
                        {/* Wifi Toggle */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialIcons name={networkEnabled ? "wifi" : "wifi-off"} size={22} color={networkEnabled ? colors.primary : "#888"} style={{ marginRight: 12 }} />
                                <Text style={{ color: theme.text, fontSize: 16 }}>{t.onlineMode}</Text>
                            </View>
                            <Switch
                                value={networkEnabled}
                                onValueChange={toggleNetwork}
                                trackColor={{ false: "#767577", true: colors.primary }}
                                thumbColor={"#f4f3f4"}
                            />
                        </View>

                        {/* Theme Toggle */}
                        <TouchableOpacity 
                            onPress={() => setIsDarkMode(!isDarkMode)}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee' }}
                        >
                            <MaterialIcons name={isDarkMode ? "dark-mode" : "light-mode"} size={22} color={isDarkMode ? "#ffd54f" : "#f57c00"} style={{ marginRight: 12 }} />
                            <Text style={{ color: theme.text, fontSize: 16 }}>{isDarkMode ? "Dark Mode" : "Light Mode"}</Text>
                        </TouchableOpacity>

                        {/* Language Selector */}
                        <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.background === '#121212' ? '#333' : '#eee' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <MaterialIcons name="language" size={22} color={colors.accent} style={{ marginRight: 12 }} />
                                <Text style={{ color: theme.text, fontSize: 16 }}>{t.language}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                                {['en', 'tl', 'ceb'].map(lang => (
                                    <TouchableOpacity key={lang} onPress={() => setLanguage(lang)} style={{ padding: 5, backgroundColor: language === lang ? colors.primary + '20' : 'transparent', borderRadius: 5 }}>
                                        <Text style={{ color: language === lang ? colors.primary : theme.text, fontWeight: language === lang ? 'bold' : 'normal' }}>
                                            {lang === 'en' ? 'English' : lang === 'tl' ? 'Tagalog' : 'Bisaya'}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Logout */}
                        <TouchableOpacity 
                            onPress={() => { setIsMenuVisible(false); handleLogout(); }}
                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }}
                        >
                            <MaterialIcons name="logout" size={22} color={colors.danger} style={{ marginRight: 12 }} />
                            <Text style={{ color: colors.danger, fontSize: 16, fontWeight: 'bold' }}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
            
            {/* Offline Banner */}
            {(isOffline || !networkEnabled) && (
                <View style={styles.offlineBanner}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>{t.offlineMode}</Text>
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
                language={language}
            />

            {/* Bulk Action Modal */}
            <BulkActionModal
                visible={!!bulkAction}
                onClose={() => setBulkAction(null)}
                onConfirm={confirmBulkAction}
                actionType={bulkAction?.type}
                itemName={bulkAction?.item?.name}
                qty={bulkQty}
                setQty={setBulkQty}
                theme={theme}
                language={language}
            />

            {/* Password Confirmation Modal for Reset */}
            <PasswordConfirmModal
                visible={isResetModalVisible}
                onClose={() => setIsResetModalVisible(false)}
                onConfirm={handleConfirmReset}
                password={resetPassword}
                setPassword={setResetPassword}
                theme={theme}
                language={language}
            />
        </View>
    );
}