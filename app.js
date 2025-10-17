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
                professional: `Using the provided manicure photo, transform it into a professional product photograph:
                    1. Remove the background completely and replace with a clean gradient from light gray to white
                    2. Add professional studio softbox lighting
                    3. Enhance nail sharpness and details
                    4. Increase nail polish color saturation
                    5. Remove any skin imperfections while keeping it natural
                    6. Add subtle shadow under the hand
                    7. Make it look like high-end beauty product photography`,
                
                glamour: `Using this manicure photo, create a glamour beauty shot:
                    1. Replace background with sparkling bokeh in pink and gold tones
                    2. Add subtle glitter particles around the nails
                    3. Increase nail polish shine and glossiness
                    4. Add warm, golden lighting
                    5. Smooth skin while maintaining natural texture
                    6. Enhance nail contours
                    7. Make it look luxurious and glamorous`,
                
                minimal: `Transform this manicure photo into minimalist style:
                    1. Replace background with pure white
                    2. Apply high-key bright lighting
                    3. Remove all distracting elements
                    4. Keep clean, simple composition
                    5. Slightly brighten overall image
                    6. Sharpen nail edges
                    7. Create a modern, minimalist aesthetic`,
                
                artistic: `Transform this manicure photo into an artistic beauty photograph:
                    1. Add creative, colorful abstract background
                    2. Apply interesting lighting with color reflections
                    3. Increase contrast and saturation
                    4. Add artistic blur in selected areas
                    5. Emphasize the unique nail design
                    6. Make it visually striking and creative`
            };

            // Użycie modelu Gemini do generowania obrazu
            const model = this.genAI.getGenerativeModel({ 
                model: "gemini-2.5-flash-image" // Poprawna nazwa modelu!
            });

            // Struktura promptu zgodna z przykładem
            const prompt = [
                {
                    inlineData: {
                        mimeType: this.currentImage.mimeType,
                        data: this.currentImage.base64
                    }
                },
                { text: prompts[style] }
            ];

            const result = await model.generateContent(prompt);
            const response = await result.response;
            
            // Sprawdzenie odpowiedzi
            if (response.candidates && response.candidates[0]) {
                const parts = response.candidates[0].content.parts;
                
                for (const part of parts) {
                    if (part.text) {
                        console.log('Otrzymano tekst:', part.text);
                    } else if (part.inlineData) {
                        // Znaleziono wygenerowany obraz!
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

                // Jeśli nie znaleziono obrazu w odpowiedzi
                if (!this.processedImageData) {
                    this.showMessage('Model nie zwrócił przetworzonego obrazu. Spróbuj ponownie.', 'error');
                    this.elements.loader.style.display = 'none';
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
