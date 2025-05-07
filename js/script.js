let qrInstance = null;
        let currentTab = 'text';
        const history = JSON.parse(localStorage.getItem('qrHistory') || '[]');

        // Инициализация при загрузке
        document.addEventListener('DOMContentLoaded', () => {
            updateHistoryPanel();
            initRangeInputs();
            loadTheme();
        });

        function initRangeInputs() {
            const qrSizeInput = document.getElementById('qrSize');
            const qrSizeValue = document.getElementById('qrSizeValue');
            
            qrSizeInput.addEventListener('input', () => {
                qrSizeValue.textContent = `${qrSizeInput.value}x${qrSizeInput.value}`;
            });
        }

        function toggleTheme() {
            document.body.classList.toggle('dark-theme');
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
            updateThemeIcon();
        }

        function loadTheme() {
            const theme = localStorage.getItem('theme');
            if (theme === 'dark') {
                document.body.classList.add('dark-theme');
            }
            updateThemeIcon();
        }

        function updateThemeIcon() {
            const icon = document.querySelector('.theme-switch i');
            icon.className = document.body.classList.contains('dark-theme') ? 
                'fas fa-sun' : 'fas fa-moon';
        }

        function toggleAdvancedOptions() {
            const advancedOptions = document.querySelector('.advanced-options');
            advancedOptions.classList.toggle('show');
        }

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelector(`.tab:nth-child(${
                tab === 'text' ? 1 : 
                tab === 'url' ? 2 : 
                tab === 'vcard' ? 3 : 
                tab === 'wifi' ? 4 : 5
            })`).classList.add('active');

            // Скрываем все input группы
            document.querySelectorAll('.input-group').forEach(group => group.style.display = 'none');
            // Показываем нужную группу
            document.getElementById(`${tab}-input`).style.display = 'block';
        }

        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        document.getElementById('inputLat').value = position.coords.latitude;
                        document.getElementById('inputLng').value = position.coords.longitude;
                    },
                    (error) => {
                        alert('Ошибка при получении геолокации: ' + error.message);
                    }
                );
            } else {
                alert('Геолокация не поддерживается вашим браузером');
            }
        }

        function setColors(dark, light) {
            document.getElementById('colorDark').value = dark;
            document.getElementById('colorLight').value = light;
            if (qrInstance) generateQR();
        }

        function createVCard() {
            const name = document.getElementById('inputName').value;
            const phone = document.getElementById('inputPhone').value;
            const email = document.getElementById('inputEmail').value;
            const org = document.getElementById('inputOrg').value;

            return `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL:${phone}
EMAIL:${email}
ORG:${org}
END:VCARD`;
        }

        function createWifiString() {
            const ssid = document.getElementById('inputSsid').value;
            const password = document.getElementById('inputPassword').value;
            const type = document.getElementById('inputWifiType').value;

            return `WIFI:T:${type};S:${ssid};P:${password};;`;
        }

        function createGeoString() {
            const lat = document.getElementById('inputLat').value;
            const lng = document.getElementById('inputLng').value;

            return `geo:${lat},${lng}`;
        }

        async function generateQR() {
            let text;
            let description;
            
            switch(currentTab) {
                case 'text':
                    text = document.getElementById('inputText').value;
                    description = text.substring(0, 30) + (text.length > 30 ? '...' : '');
                    break;
                case 'url':
                    text = document.getElementById('inputUrl').value;
                    if (text && !text.startsWith('http')) {
                        text = 'https://' + text;
                    }
                    description = 'URL: ' + text;
                    break;
                case 'vcard':
                    text = createVCard();
                    description = 'VCard: ' + document.getElementById('inputName').value;
                    break;
                case 'wifi':
                    text = createWifiString();
                    description = 'Wi-Fi: ' + document.getElementById('inputSsid').value;
                    break;
                case 'geo':
                    text = createGeoString();
                    description = 'Геолокация';
                    break;
            }

            if (!text) {
                alert("Пожалуйста, заполните необходимые поля!");
                return;
            }

            const generateBtn = document.getElementById('generate-btn');
            generateBtn.classList.add('loading');
            generateBtn.disabled = true;

            // Очищаем предыдущий QR-код
            document.getElementById("qrcode").innerHTML = "";
            
            const size = parseInt(document.getElementById("qrSize").value);
            const colorDark = document.getElementById("colorDark").value;
            const colorLight = document.getElementById("colorLight").value;
            const errorCorrection = document.getElementById("errorCorrection").value;

            // Показываем блок QR-кода перед генерацией
            document.getElementById("qrcode").style.display = "flex";

            // Генерируем новый QR-код
            qrInstance = new QRCode(document.getElementById("qrcode"), {
                text: text,
                width: size,
                height: size,
                colorDark: colorDark,
                colorLight: colorLight,
                correctLevel: QRCode.CorrectLevel[errorCorrection]
            });

            // Добавляем в историю
            const historyItem = {
                text: description,
                date: new Date().toLocaleString(),
                type: currentTab,
                preview: document.querySelector("#qrcode canvas").toDataURL()
            };

            history.unshift(historyItem);
            if (history.length > 10) history.pop();
            localStorage.setItem('qrHistory', JSON.stringify(history));
            updateHistoryPanel();

            // Показываем кнопки действий
            setTimeout(() => {
                document.getElementById("download-btn").style.display = "block";
                document.getElementById("copy-btn").style.display = "block";
                document.getElementById("share-btn").style.display = "block";
                generateBtn.classList.remove('loading');
                generateBtn.disabled = false;
            }, 500);
        }

        function updateHistoryPanel() {
            const historyList = document.getElementById('history-list');
            historyList.innerHTML = '';

            history.forEach((item, index) => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <img src="${item.preview}" alt="QR Preview">
                    <div class="history-item-info">
                        <div>${item.text}</div>
                        <div class="history-item-date">${item.date}</div>
                    </div>
                `;
                historyItem.onclick = () => restoreFromHistory(index);
                historyList.appendChild(historyItem);
            });
        }

        function restoreFromHistory(index) {
            const item = history[index];
            switchTab(item.type);
            // Здесь можно добавить логику восстановления значений полей
            generateQR();
        }

        function clearHistory() {
            if (confirm('Вы уверены, что хотите очистить историю?')) {
                history.length = 0;
                localStorage.removeItem('qrHistory');
                updateHistoryPanel();
            }
        }

        async function downloadQR() {
            const qrCanvas = document.querySelector("#qrcode canvas");
            if (!qrCanvas) return;

            try {
                const link = document.createElement('a');
                link.download = 'qr-code.png';
                link.href = qrCanvas.toDataURL('image/png');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Ошибка при скачивании:', error);
                alert('Произошла ошибка при скачивании QR-кода');
            }
        }

        async function copyQR() {
            const qrCanvas = document.querySelector("#qrcode canvas");
            if (!qrCanvas) return;

            try {
                // Создаем временный canvas для добавления белого фона
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                tempCanvas.width = qrCanvas.width;
                tempCanvas.height = qrCanvas.height;

                // Добавляем белый фон
                tempCtx.fillStyle = '#ffffff';
                tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                
                // Копируем QR-код
                tempCtx.drawImage(qrCanvas, 0, 0);

                // Конвертируем в blob
                const blob = await new Promise(resolve => tempCanvas.toBlob(resolve));
                
                try {
                    // Пробуем использовать новый API буфера обмена
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': blob
                        })
                    ]);
                    showToast('QR-код скопирован в буфер обмена!');
                } catch (e) {
                    // Если новый API не поддерживается, пробуем старый метод
                    const data = new ClipboardItem({
                        'image/png': blob
                    });
                    await navigator.clipboard.write([data]);
                    showToast('QR-код скопирован в буфер обмена!');
                }
            } catch (error) {
                console.error('Ошибка при копировании:', error);
                showToast('Ошибка при копировании QR-кода', true);
            }
        }

        async function shareQR() {
            const qrCanvas = document.querySelector("#qrcode canvas");
            if (!qrCanvas) return;

            try {
                const blob = await new Promise(resolve => qrCanvas.toBlob(resolve));
                const file = new File([blob], 'qr-code.png', { type: 'image/png' });
                
                if (navigator.share) {
                    await navigator.share({
                        files: [file],
                        title: 'QR Code',
                        text: 'Сгенерированный QR-код'
                    });
                } else {
                    // Показываем модальное окно с альтернативными способами поделиться
                    document.getElementById('share-modal').classList.add('show');
                }
            } catch (error) {
                console.error('Ошибка при попытке поделиться:', error);
                showToast('Произошла ошибка при попытке поделиться', true);
            }
        }

        function closeShareModal() {
            document.getElementById('share-modal').classList.remove('show');
        }

        async function getQRImageUrl() {
            const qrCanvas = document.querySelector("#qrcode canvas");
            if (!qrCanvas) return null;
            return qrCanvas.toDataURL('image/png');
        }

        async function shareQRViaEmail() {
            const imageUrl = await getQRImageUrl();
            if (!imageUrl) return;
            
            const subject = encodeURIComponent('QR Code');
            const body = encodeURIComponent('Вот ваш QR-код:\n\n');
            window.location.href = `mailto:?subject=${subject}&body=${body}`;
            closeShareModal();
        }

        async function shareQRViaWhatsApp() {
            const imageUrl = await getQRImageUrl();
            if (!imageUrl) return;
            
            const text = encodeURIComponent('Вот ваш QR-код');
            window.open(`https://wa.me/?text=${text}`, '_blank');
            closeShareModal();
        }

        async function shareQRViaTelegram() {
            const imageUrl = await getQRImageUrl();
            if (!imageUrl) return;
            
            const text = encodeURIComponent('Вот ваш QR-код');
            window.open(`https://t.me/share/url?url=${text}`, '_blank');
            closeShareModal();
        }

        async function shareQRViaSMS() {
            const text = encodeURIComponent('Вот ваш QR-код');
            window.location.href = `sms:?body=${text}`;
            closeShareModal();
        }

        // Закрываем модальное окно при клике вне его содержимого
        document.getElementById('share-modal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeShareModal();
            }
        });

        // Закрываем модальное окно при нажатии Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && document.getElementById('share-modal').classList.contains('show')) {
                closeShareModal();
            }
        });

        function showToast(message, isError = false) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.background = isError ? 'rgba(229, 62, 62, 0.9)' : 'rgba(0, 0, 0, 0.8)';
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        // Автоматическая генерация QR-кода при изменении параметров
        ['colorDark', 'colorLight', 'qrSize', 'errorCorrection'].forEach(id => {
            document.getElementById(id).addEventListener('change', generateQR);
        });