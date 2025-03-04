import { createConnection } from '$lib/database/mysql.js';
import { promises as fs } from 'fs';

import { BASIC_AUTH_USER, BASIC_AUTH_PASSWORD } from '$env/static/private';
async function authenticate(request) {
    const auth = request.headers.get('authorization');
    if (!auth || auth !== `Basic ${btoa(`${BASIC_AUTH_USER}:${BASIC_AUTH_PASSWORD}`)}`) {
        return new Response(null, {
            status: 401,
            headers: { 'www-authenticate': 'Basic realm="rivers API"' }
        });
    }
 
    const base64Credentials = auth.split(' ')[1];
    const credentials = atob(base64Credentials);
    const [username, password] = credentials.split(':');
 
    if (username !== BASIC_AUTH_USER || password !== BASIC_AUTH_PASSWORD) {
        return new Response(JSON.stringify({ message: 'Access denied' }), {
            status: 401,
            headers: { 'www-authenticate': 'Basic realm="rivers API"' }
        });
    }
 
    return null;
}
// GET: Fetch all rivers or a specific river by ID
export async function GET({ params }) {
    const { uuid } = params;
    const connection = await createConnection();
    
    let query = 'SELECT * FROM Rivers';
    let values = [];

    if (uuid) {
        query += ' WHERE id = ?';
        values.push(uuid);
    }

    const [rows] = await connection.execute(query, values);
    

    return new Response(JSON.stringify(uuid ? rows[0] : rows), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}

// POST: Add a new river
export async function POST({ request }) {
    const authResponse = await authenticate(request);
    if (authResponse) return authResponse;
    const data = await request.json();
    const connection = await createConnection();

    const [result] = await connection.execute(
        'INSERT INTO Rivers (name, length_km, source, mouth, description) VALUES (?, ?, ?, ?, ?)',
        [data.name, data.length_km, data.source, data.mouth, data.description]
    );

    const newRiverId = result.insertId;
    const [rows] = await connection.execute('SELECT * FROM Rivers WHERE id = ?', [newRiverId]);


    return new Response(JSON.stringify(rows[0]), {
        status: 201,
        headers: { 'content-type': 'application/json' }
    });
}
