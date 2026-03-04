export const DbConfig = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'Granpa Wang',
    user: process.env.DB_USER || 'sqlserver',
    password: process.env.DB_PASSWORD || 'sqlserver',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

export default DbConfig;
