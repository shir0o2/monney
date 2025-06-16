from flask import Flask, request, jsonify
from flask_cors import CORS # type: ignore
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
DB_DIR = 'data'
DB_FILE = 'database.json'
DB_PATH = os.path.join(os.path.dirname(__file__), DB_DIR, DB_FILE)

# Helper functions for database operations
def init_db():
    """Initialize the database directory and file"""
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, 'w') as f:
            json.dump({
                'users': [{
                    'username': 'admin',
                    'password': 'admin123',  # In production, use hashed passwords
                    'name': 'Admin'
                }],
                'transactions': []
            }, f, indent=2)

def read_db():
    """Read data from the database file"""
    try:
        with open(DB_PATH, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        init_db()
        return read_db()

def write_db(data):
    """Write data to the database file"""
    with open(DB_PATH, 'w') as f:
        json.dump(data, f, indent=2)

# Initialize database
init_db()

# Error handlers
@app.errorhandler(400)
def bad_request(error):
    return jsonify({'success': False, 'message': 'Bad request'}), 400

@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# Authentication routes
@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Username and password required'}), 400

        username = data['username']
        password = data['password']
        db = read_db()
        
        user = next((u for u in db['users'] if u['username'] == username and u['password'] == password), None)
        
        if user:
            return jsonify({
                'success': True,
                'user': {
                    'name': user['name'],
                    'username': user['username']
                }
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Transaction routes
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    try:
        db = read_db()
        return jsonify({
            'success': True,
            'transactions': db['transactions']
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions', methods=['POST'])
def add_transaction():
    try:
        transaction = request.get_json()
        
        # Validate required fields
        required_fields = ['type', 'name', 'amount', 'category']
        if not all(field in transaction for field in required_fields):
            return jsonify({
                'success': False,
                'message': f'Missing required fields: {required_fields}'
            }), 400

        db = read_db()
        
        # Create new transaction with additional metadata
        new_transaction = {
            'id': datetime.now().timestamp(),
            'date': datetime.now().isoformat(),
            'createdAt': datetime.now().isoformat(),
            **transaction
        }
        
        db['transactions'].append(new_transaction)
        write_db(db)
        
        return jsonify({
            'success': True,
            'message': 'Transaction added successfully',
            'transaction': new_transaction
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions/<transaction_id>', methods=['PUT'])
def update_transaction(transaction_id):
    try:
        updates = request.get_json()
        if not updates:
            return jsonify({'success': False, 'message': 'No update data provided'}), 400

        db = read_db()
        
        for i, t in enumerate(db['transactions']):
            if str(t['id']) == transaction_id:
                # Preserve existing fields not being updated
                db['transactions'][i] = {
                    **db['transactions'][i],
                    **updates,
                    'updatedAt': datetime.now().isoformat()
                }
                write_db(db)
                return jsonify({
                    'success': True,
                    'message': 'Transaction updated successfully'
                })
        
        return jsonify({'success': False, 'message': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/transactions/<transaction_id>', methods=['DELETE'])
def delete_transaction(transaction_id):
    try:
        db = read_db()
        initial_count = len(db['transactions'])
        
        db['transactions'] = [t for t in db['transactions'] if str(t['id']) != transaction_id]
        
        if len(db['transactions']) < initial_count:
            write_db(db)
            return jsonify({'success': True, 'message': 'Transaction deleted successfully'})
        else:
            return jsonify({'success': False, 'message': 'Transaction not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)