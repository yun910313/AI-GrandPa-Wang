import Database from 'better-sqlite3';

const db = new Database('ltc_app_v2.db');

try {
    console.log('Checking users table columns...');
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
    const columnNames = tableInfo.map(info => info.name);

    if (!columnNames.includes('username')) {
        console.log('Adding username column...');
        db.prepare("ALTER TABLE users ADD COLUMN username TEXT").run();
        console.log('Added username column.');
    } else {
        console.log('Username column already exists.');
    }

    if (!columnNames.includes('password')) {
        console.log('Adding password column...');
        db.prepare("ALTER TABLE users ADD COLUMN password TEXT").run();
        console.log('Added password column.');
    } else {
        console.log('Password column already exists.');
    }

    // Ensure unique constraint if missing? SQLite ALTER TABLE is limited.
    // For now, let's just make sure the columns are there.

} catch (error: any) {
    console.error('Migration failed:', error.message);
} finally {
    db.close();
}
