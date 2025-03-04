import { promises as fs } from 'fs';
import { createConnection } from '$lib/database/mysql.js';
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

// GET: Fetch a specific river by ID
export async function GET({ params }) {
  const { uuid } = params;
  const connection = await createConnection();
  
  try {
    const [rows] = await connection.execute('SELECT * FROM Rivers WHERE id = ?;', [uuid]);
    const river = rows[0];

    if (!river) {
      return new Response(JSON.stringify({ error: 'River not found' }), { status: 404 });
    }

    return new Response(JSON.stringify(river), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } 
}

// PUT: Update a river's details
export async function PUT({ params, request }) {
  const authResponse = await authenticate(request);
  if (authResponse) return authResponse;
  const { uuid } = params;
  const data = await request.json();
  const connection = await createConnection();

  try {
    const [result] = await connection.execute(
      `UPDATE Rivers
       SET
         name = COALESCE(?, name),
         length_km = COALESCE(?, length_km),
         source = COALESCE(?, source),
         mouth = COALESCE(?, mouth),
         description = COALESCE(?, description)
       WHERE id = ?;`,
      [
        data.name ?? null,
        data.length_km ?? null,
        data.source ?? null,
        data.mouth ?? null,
        data.description ?? null,
        uuid
      ]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'River not found or no changes made' }), { status: 404 });
    }

    const [updatedRiver] = await connection.execute(
      'SELECT * FROM Rivers WHERE id = ?;',
      [uuid]
    );

    return new Response(JSON.stringify(updatedRiver[0]), {
      status: 200,
      headers: { 'content-type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } finally {
    await connection.end();
  }
}

// DELETE: Remove a river by ID
export async function DELETE({ params, request }) {
  const authResponse = await authenticate(request);
  if (authResponse) return authResponse;
  const { uuid } = params;
  const connection = await createConnection();

  try {
    const [result] = await connection.execute(
      'DELETE FROM Rivers WHERE id = ?;',
      [uuid]
    );

    if (result.affectedRows === 0) {
      return new Response(JSON.stringify({ error: 'River not found' }), { status: 404 });
    }

    return new Response(null, { status: 204 });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  } 
}

