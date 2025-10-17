// Import Google Generative AI SDK
import { GoogleGenerativeAI } from 'https://esm.run/@google/generative-ai';

class ManicureEditor {
    constructor() {
        this.apiKey = null;
        this.genAI = null;
        this.currentImage = null;
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.elements = {
            apiKeyInput: document.getElementById('apiKey'),
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            optionsSection: document.getElementById('optionsSection'),
            resultsSection: document.getElementById('resultsSection'),
            originalImage: document.getElementById('originalImage'),
            processedImage: document.getElementById('processedImage'),
            loader: document.getElementById('loader'),
            processBtn: document.getElementById('processBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            newPhotoBtn: document.getElementById('newPhotoBtn'),
            errorMessage: document.getElementById('errorMessage')
        };
    }

    attachEventListeners() {
        // API Key input
        this.elements.apiKeyInput.addEventListener('change', (e) => {
            this.apiKey = e.target.value.trim();
            if (this.apiKey) {
                this.genAI = new GoogleGenerativeAI(this.apiKey);
                this.showMessage('Klucz API zapisany!', 'success');
            }
        });

        // File upload
        this.elements.uploadArea.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.add('dragover');
        });

        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.classList.remove('dragover');
        });

        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.uploadArea.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleImage(file);
            }
        });

        this.elements.fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImage(file);
            }
        });

        // Process button
        this.elements.processBtn.addEventListener('click', () => {
            this.processImage();
        });

        // Download button
        this.elements.downloadBtn.addEventListener('click', () => {
            this.downloadImage();
        });

        // New photo button
        this.elements.newPhotoBtn.addEventListener('click', () => {
            this.resetApp();
        });
    }

    handleImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentImage = {
                dataUrl: e.target.result,
                base64: e.target.result.split(',')[1],
                mimeType: file.type,
                name: file.name
            };
            
            this.elements.originalImage.src = this.currentImage.dataUrl;
            this.elements.optionsSection.style.display = 'block';
            this.elements.resultsSection.style.display = 'none';
        };
        reader.readAsDataURL(file);
    }

    async processImage() {
        if (!this.apiKey) {
            this.showMessage('Wprowadź klucz API Google AI Studio!', 'error');
            return;
        }

        if (!this.currentImage) {
            this.showMessage('Wybierz zdjęcie do przetworzenia!', 'error');
            return;
        }

        const style = document.querySelector('input[name="style"]:checked').value;
        
        this.elements.resultsSection.style.display = 'block';
        this.elements.loader.style.display = 'block';
        this.elements.processedImage.style.display = 'none';
        this.elements.downloadBtn.style.display = 'none';

        try {
            // Przygotowanie promptu na podstawie wybranego stylu
            const prompts = {
                professional: `Przekształć to zdjęcie manicure w profesjonalną fotografię produktową:
                    1. Usuń całkowicie tło
                    2. Dodaj gradient tła od jasnoszarego do białego
                    3. Dodaj profesjonalne oświetlenie studyjne typu softbox
                    4. Popraw ostrość i szczegóły paznokci
                    5. Zwiększ nasycenie koloru lakieru
                    6. Usuń wszystkie niedoskonałości skóry
                    7. Dodaj subtelny cień pod dłonią`,
                
                glamour: `Przekształć to zdjęcie manicure w glamour shot:
                    1. Usuń tło i zastąp błyszczącym, rozmytym bokeh w odcieniach różu i złota
                    2. Dodaj delikatne cząsteczki brokatu wokół paznokci
                    3. Zwiększ blask i połysk lakieru
                    4. Dodaj ciepłe, złote oświetlenie
                    5. Wygładź skórę zachowując naturalność
                    6. Podkreśl kontury paznokci`,
                
                minimal: `Stwórz minimalistyczną wersję zdjęcia manicure:
                    1. Usuń tło i zastąp czystym białym
                    2. Zastosuj wysokie oświetlenie high-key
                    3. Usuń wszystkie rozpraszające elementy
                    4. Zachowaj czystą, prostą kompozycję
                    5. Lekko rozjaśnij całość
                    6. Wyostrz krawędzie paznokci`,
                
                artistic: `Przekształć zdjęcie manicure w artystyczną fotografię:
                    1. Dodaj kreatywne, kolorowe tło z abstrakcyjnymi kształtami
                    2. Zastosuj interesujące oświetlenie z kolorowymi refleksami
                    3. Zwiększ kontrast i saturację
                    4. Dodaj artystyczny efekt rozmycia w wybranych miejscach
                    5. Podkreśl unikalność designu paznokci`
            };

            // Użycie modelu Gemini do generowania obrazu
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash-exp",
                generationConfig: {
                    responseMimeType: "image/png"
                }
            });

            const result = await model.generateContent([
                prompts[style],
                {
                    inlineData: {
                        mimeType: this.currentImage.mimeType,
                        data: this.currentImage.base64
                    }
                }
            ]);

            const response = await result.response;
            
            // Sprawdzenie czy odpowiedź zawiera obraz
            if (response.candidates && response.candidates[0]) {
                const parts = response.candidates[0].content.parts;
                
                for (const part of parts) {
                    if (part.inlineData) {
                        const imageData = part.inlineData.data;
                        const imageMimeType = part.inlineData.mimeType || 'image/png';
                        
                        // Wyświetlenie przetworzonego obrazu
                        const processedImageUrl = `data:${imageMimeType};base64,${imageData}`;
                        this.elements.processedImage.src = processedImageUrl;
                        this.elements.processedImage.style.display = 'block';
                        this.elements.loader.style.display = 'none';
                        this.elements.downloadBtn.style.display = 'block';
                        
                        this.processedImageData = {
                            url: processedImageUrl,
                            mimeType: imageMimeType
                        };
                        
                        this.showMessage('Zdjęcie przetworzone pomyślnie!', 'success');
                        break;
                    }
                }
            }
        } catch (error) {
            console.error('Błąd przetwarzania:', error);
            this.showMessage(`Błąd: ${error.message}`, 'error');
            this.elements.loader.style.display = 'none';
        }
    }

    downloadImage() {
        if (this.processedImageData) {
            const link = document.createElement('a');
            link.download = `manicure_${Date.now()}.png`;
            link.href = this.processedImageData.url;
            link.click();
        }
    }

    resetApp() {
        this.currentImage = null;
        this.processedImageData = null;
        this.elements.fileInput.value = '';
        this.elements.optionsSection.style.display = 'none';
        this.elements.resultsSection.style.display = 'none';
    }

    showMessage(message, type = 'info') {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.className = `message message-${type}`;
        this.elements.errorMessage.style.display = 'block';
        
        setTimeout(() => {
            this.elements.errorMessage.style.display = 'none';
        }, 5000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ManicureEditor();
});
