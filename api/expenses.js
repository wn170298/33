// This file implements the serverless function for the /api/expenses endpoint.

// A simple in-memory array to store expenses. 
// In a real application, you would use a database (e.g., MongoDB, PostgreSQL).
let expenses = [
    {
        id: 1,
        amount: 50.00,
        description: "Groceries from local store",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 2,
        amount: 15.50,
        description: "Coffee and sandwich",
        category: "Food",
        date: "2023-11-29"
    },
    {
        id: 3,
        amount: 300.00,
        description: "Monthly rent payment",
        category: "Housing",
        date: "2023-12-01"
    }
];

let nextId = 4;

/**
 * Main handler for the Vercel Serverless Function.
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse} res
 */
export default async function handler(req, res) {
    const { method } = req;

    // Set CORS headers to allow requests from any origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle CORS preflight requests
    if (method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    switch (method) {
        case 'GET':
            // GET /api/expenses: Returns all expenses
            return getExpenses(req, res);
        case 'POST':
            // POST /api/expenses: Adds a new expense
            return addExpense(req, res);
        default:
            // Method not allowed
            res.setHeader('Allow', ['GET', 'POST']);
            res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
}

// --- Handler Functions ---

function getExpenses(req, res) {
    res.status(200).json(expenses);
}

async function addExpense(req, res) {
    try {
        const expenseData = await getJsonBody(req);

        // Required fields validation
        const requiredFields = ['amount', 'description', 'category', 'date'];
        for (const field of requiredFields) {
            if (!expenseData[field]) {
                return res.status(400).json({
                    error: `Missing required field: ${field}`
                });
            }
        }

        // Basic type validation for amount
        const amount = parseFloat(expenseData.amount);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({
                error: 'Amount must be a positive number'
            });
        }

        // Create new expense object
        const newExpense = {
            id: nextId++,
            amount: amount.toFixed(2), // Store as string with 2 decimals
            description: expenseData.description,
            category: expenseData.category,
            date: expenseData.date
        };

        expenses.push(newExpense);

        // 201 Created status
        res.status(201).json(newExpense);

    } catch (error) {
        console.error('Error processing POST request:', error);
        res.status(500).json({ error: 'Failed to parse request body or internal error' });
    }
}

/**
 * Helper function to parse the JSON body of the request.
 * @param {import('http').IncomingMessage} req
 * @returns {Promise<Object>}
 */
function getJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
