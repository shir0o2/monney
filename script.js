// script.js - Modifikasi untuk koneksi ke backend
const API_BASE_URL = 'http://localhost:3001/api';

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Fungsi untuk memuat transaksi dari backend
async function loadTransactions() {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) throw new Error('Gagal memuat transaksi');
        
        const data = await response.json();
        renderTransactions(data);
    } catch (error) {
        showNotification(error.message, false);
        console.error('Error:', error);
    }
}

// Fungsi untuk merender transaksi ke DOM
function renderTransactions(transactions) {
    const container = document.getElementById('transactions');
    container.innerHTML = transactions.map(transaction => `
        <div class="transaction ${transaction.type}">
            <span>${transaction.name}</span>
            <span>${transaction.type === 'income' ? '+' : '-'}Rp${transaction.amount}</span>
            <button class="delete-btn" data-id="${transaction.id}">Hapus</button>
        </div>
    `).join('');

    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            await deleteTransaction(id);
        });
    });
}

// Fungsi untuk menambahkan transaksi baru
async function addTransaction(transactionData) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(transactionData)
        });
        
        if (!response.ok) throw new Error('Gagal menambahkan transaksi');
        
        const result = await response.json();
        showNotification('Transaksi berhasil ditambahkan');
        loadTransactions(); // Memuat ulang daftar transaksi
        return result;
    } catch (error) {
        showNotification(error.message, false);
        console.error('Error:', error);
    }
}

// Fungsi untuk menghapus transaksi
async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Gagal menghapus transaksi');
        
        showNotification('Transaksi berhasil dihapus');
        loadTransactions(); // Memuat ulang daftar transaksi
    } catch (error) {
        showNotification(error.message, false);
        console.error('Error:', error);
    }
}

// Event listener untuk tombol tambah transaksi
document.getElementById('addTransaction').addEventListener('click', async () => {
    const name = prompt("Nama Transaksi:");
    if (!name) return;
    
    const amount = parseFloat(prompt("Jumlah:"));
    if (isNaN(amount)) {
        showNotification('Jumlah harus berupa angka', false);
        return;
    }
    
    const type = confirm("Pemasukan? (OK untuk Ya, Cancel untuk Pengeluaran)") ? 'income' : 'expense';
    
    await addTransaction({ name, amount, type });
});

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
});

// CSS untuk notifikasi (bisa dipindah ke file CSS terpisah)
const style = document.createElement('style');
style.textContent = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px;
    border-radius: 5px;
    color: white;
    z-index: 1000;
    animation: slideIn 0.5s forwards;
}
.notification.success {
    background-color: #4CAF50;
}
.notification.error {
    background-color: #F44336;
}
@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
`;
document.head.appendChild(style);