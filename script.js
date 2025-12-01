document.addEventListener('DOMContentLoaded', function() {
    // 1. Setup Tombol Download
    const btn = document.getElementById('downloadBtn');
    if (btn) {
        btn.addEventListener('click', processVideo);
    }
    
    // 2. Setup Jam Taskbar (Realtime)
    setInterval(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const clockEl = document.querySelector('.clock');
        if (clockEl) {
            clockEl.innerText = timeString;
        }
    }, 1000);
});

// --- KONFIGURASI API ---
const rapidApiKey = '9fa87cb832msh951f5c755373df7p1f46cajsn459f2635b5c5'; 
const rapidApiHost = 'social-download-all-in-one.p.rapidapi.com';

async function processVideo() {
    const urlInput = document.getElementById('videoUrl').value;
    const resultArea = document.getElementById('resultArea');
    const loader = document.getElementById('loader');
    const content = document.getElementById('downloadContent');
    const resList = document.getElementById('resolutionList');
    const videoMeta = document.getElementById('videoMeta');

    // Validasi Input
    if (!urlInput || urlInput.trim() === "") {
        alert("ERROR: URL NOT FOUND. PLEASE INPUT LINK.");
        return;
    }

    // UI Loading
    resultArea.classList.remove('hidden');
    loader.classList.remove('hidden');
    content.classList.add('hidden');
    resList.innerHTML = ''; 
    videoMeta.innerHTML = '';

    const apiUrl = 'https://social-download-all-in-one.p.rapidapi.com/v1/social/autolink';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'x-rapidapi-key': rapidApiKey,
                'x-rapidapi-host': rapidApiHost,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: urlInput }) 
        });

        if (!response.ok) throw new Error("Server Error");

        const data = await response.json();
        renderResult(data);

    } catch (error) {
        console.error(error);
        loader.classList.add('hidden');
        alert("SYSTEM FAILURE: " + error.message);
    }
}

function renderResult(data) {
    const loader = document.getElementById('loader');
    const content = document.getElementById('downloadContent');
    const resList = document.getElementById('resolutionList');
    const videoMeta = document.getElementById('videoMeta');

    loader.classList.add('hidden');
    content.classList.remove('hidden');

    const title = data.title || "Unknown_File.mp4";
    const img = data.cover || data.thumbnail || "https://via.placeholder.com/300x200?text=No+Image";

    videoMeta.innerHTML = `
        <img src="${img}" alt="Thumbnail">
        <p style="font-family:'VT323'; font-size:1.2rem; margin-top:5px;">${title}</p>
    `;

    // --- LOGIKA SORTING ---
    let links = []; 
    
    if (data.medias && Array.isArray(data.medias)) {
        links = data.medias;
    } else if (data.url) {
        links.push({ quality: 'HD', url: data.url, extension: 'mp4' });
    }

    const getResValue = (item) => {
        if (item.extension === 'mp3' || item.type === 'audio') return 0;
        const qual = item.quality || ""; 
        const match = qual.match(/(\d+)/);
        if (match) return parseInt(match[0]);
        return 1; 
    };

    links.sort((a, b) => getResValue(b) - getResValue(a));

    if (links.length > 0) {
        links.forEach(item => {
            if (item.url) {
                const linkBtn = document.createElement('a');
                linkBtn.className = 'res-btn';
                linkBtn.href = item.url;
                linkBtn.target = '_blank';
                
                let label = item.quality || item.extension || 'Download';
                if (item.formattedSize) label += ` (${item.formattedSize})`;
                
                let icon = 'fa-file-video';
                if (item.extension === 'mp3' || item.type === 'audio') {
                    icon = 'fa-music';
                    label = "Audio Only";
                }

                linkBtn.innerHTML = `
                    <span><i class="fa-solid ${icon}"></i> DOWNLOAD</span>
                    <span class="quality-badge">${label}</span>
                `;
                resList.appendChild(linkBtn);
            }
        });
    } else {
        resList.innerHTML = '<p>DATA CORRUPTED: No links found.</p>';
    }
} 
// PASTIKAN KURUNG KURAWAL INI TERSALIN (Ini menutup fungsi renderResult)

function resetApp() {
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('videoUrl').value = '';
    document.getElementById('videoUrl').focus();
}
// PASTIKAN KURUNG KURAWAL INI JUGA TERSALIN (Ini menutup fungsi resetApp)