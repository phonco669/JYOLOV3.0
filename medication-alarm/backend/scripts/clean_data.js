"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.resolve(__dirname, '../medication_alarm.db');
const db = new sqlite3_1.default.Database(dbPath);
const cleanData = () => {
    db.serialize(() => {
        // Disable foreign key constraints temporarily to allow deletion in any order (though we try to be ordered)
        db.run("PRAGMA foreign_keys = OFF");
        const tables = ['records', 'plans', 'medications', 'todos', 'follow_ups', 'body_states', 'users'];
        tables.forEach(table => {
            db.run(`DELETE FROM ${table}`, (err) => {
                if (err)
                    console.error(`Error cleaning ${table}:`, err);
                else
                    console.log(`${table} cleaned.`);
            });
        });
        // Reset auto-increment counters
        db.run("DELETE FROM sqlite_sequence", (err) => {
            if (err)
                console.error("Error resetting sequences:", err);
            else
                console.log("Sequences reset.");
        });
        // Re-enable foreign keys
        db.run("PRAGMA foreign_keys = ON");
        // Seed default user
        db.run("INSERT INTO users (id, openid) VALUES (1, 'test_user_openid')", (err) => {
            if (err)
                console.error("Error seeding default user:", err);
            else
                console.log("Default user (id=1) created.");
        });
    });
    // Close connection after a short delay to ensure operations complete (serialize should handle it, but just in case)
    setTimeout(() => {
        db.close((err) => {
            if (err)
                console.error("Error closing db:", err);
            else
                console.log("Database connection closed.");
        });
    }, 1000);
};
cleanData();
