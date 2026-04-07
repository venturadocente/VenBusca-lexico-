// Mock Database of inactive lexicon/technical terms
const lexiconDb = {
    "resiliencia": {
        concept: "Capacidad de adaptación de un ser vivo frente a un agente perturbador o un estado o situación adversos.",
        synonyms: ["fortaleza", "resistencia", "entereza", "aguante"],
        example: "A pesar de perder su trabajo y su casa el mismo año, mostró una increíble resiliencia y logró reconstruir su negocio desde cero."
    },
    "mitigar": {
        concept: "Atenuar o suavizar una cosa negativa, como una enfermedad o un dolor.",
        synonyms: ["reducir", "disminuir", "paliar", "calmar"],
        example: "Para mitigar los efectos del cambio climático, la empresa decidió reducir sus emisiones de carbono en un 50% este año."
    },
    "heuristica": {
        concept: "Técnica de indagación y descubrimiento; método mental rápido para resolver problemas, aunque no garantice una solución perfecta.",
        synonyms: ["estrategia", "regla empírica", "táctica", "exploración"],
        example: "Al no tener tiempo para analizar todos los datos, el gerente usó una heurística simple: elegir la opción que funcionó bien el mes pasado."
    },
    "pragmatico": {
        concept: "Que se refiere a la práctica, la ejecución o la realización de las acciones y no a la teoría o especulación.",
        synonyms: ["práctico", "realista", "objetivo", "utilitario"],
        example: "Ana tomó una decisión muy pragmática: eligió el coche que consumía menos y era más barato de mantener, en lugar del deportivo que le gustaba."
    },
    "idiosincrasia": {
        concept: "Modo de ser que es característico de una persona o cosa y la distingue de las demás.",
        synonyms: ["carácter", "personalidad", "índole", "naturaleza"],
        example: "La puntualidad extrema es parte de la idiosincrasia de la cultura japonesa."
    },
    "epistemologia": {
        concept: "Rama de la filosofía que estudia los principios, fundamentos, extensión y métodos del conocimiento humano.",
        synonyms: ["teoría del conocimiento", "gnoseología"],
        example: "Durante la clase de epistemología, debatimos si todo nuestro conocimiento proviene exclusivamente de la experiencia empírica."
    },
    "procrastinar": {
        concept: "Diferir, aplazar. La acción de retrasar actividades que deben atenderse, sustituyéndolas por otras situaciones más irrelevantes o agradables.",
        synonyms: ["posponer", "aplazar", "dilatar", "retrasar"],
        example: "Sabía que el informe debía entregarse mañana, pero decidió procrastinar viendo una temporada entera de su serie favorita."
    },
    "obsolescencia": {
        concept: "Cualidad de volverse anticuado, inadecuado a las circunstancias actuales, a menudo debido a la aparición de nuevas tecnologías.",
        synonyms: ["anticuación", "caducidad", "desuso"],
        example: "El teléfono móvil sufrió de obsolescencia programada, dejando de recibir actualizaciones clave tras solo dos años de su lanzamiento."
    },
    "sinergia": {
        concept: "Acción de dos o más causas cuyo efecto es superior a la suma de los efectos individuales.",
        synonyms: ["colaboración", "cooperación", "alianza", "unión"],
        example: "Al unir el departamento de marketing con el de desarrollo se creó una gran sinergia: lanzaron un producto mucho más adaptado a lo que pedía el público."
    },
    "algoritmo": {
        concept: "Conjunto ordenado y finito de operaciones que permite hallar la solución de un problema.",
        synonyms: ["procedimiento", "método", "fórmula", "rutina"],
        example: "El ingeniero diseñó un algoritmo para que el ascensor siempre recoja primero a la persona que ha esperado más tiempo."
    }
};

// Normalize string (remove accents and make lowercase)
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

// DOM Elements
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const loadingContainer = document.getElementById('loading');
const resultContainer = document.getElementById('result-container');
const errorContainer = document.getElementById('error-container');

// Result Elements
const wordTitle = document.getElementById('word-title');
const wordConcept = document.getElementById('word-concept');
const wordSynonyms = document.getElementById('word-synonyms');
const wordExample = document.getElementById('word-example');
const audioBtn = document.getElementById('audio-btn');

// Event Listener for the form
searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const query = searchInput.value;
    if (!query) return;

    // Reset UI
    resultContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    loadingContainer.classList.remove('hidden');

    searchWord(query);
});

// Function to handle the actual search and rendering
async function searchWord(query) {
    const normalizedQuery = normalizeString(query);
    
    try {
        // --- 1. INTELIGENCIA ARTIFICIAL INTEGRADA (Sin API Key, Búsqueda Infinita) ---
        // Usaremos un servicio público de IA (Pollinations) que nos permite consultas directas
        // Esto garantiza infinitas búsquedas de cualquier palabra existente o tecnicismo.
        
        const promptText = `Eres un experto lingüista y diccionario. Define la palabra "${query}". 
Responde ÚNICAMENTE con un objeto JSON válido (sin formato markdown ni explicaciones previas) con la siguiente estructura exacta:
{
  "concept": "El concepto puntual de la palabra.",
  "synonyms": ["sinónimo1", "sinónimo2", "sinónimo3", "sinónimo4"],
  "example": "Un ejemplo práctico y cotidiano usando la palabra."
}`;

        const encodedPrompt = encodeURIComponent(promptText);
        // Usamos model=openai para mayor consistencia
        const iaResponse = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai`);

        if (iaResponse.ok) {
            let textResp = await iaResponse.text();
            
            // Limpiar posibles bloques de código markdown que la IA a veces devuelve (ej. ```json ... ```)
            textResp = textResp.replace(/```json/gi, '').replace(/```/g, '').trim();
            
            try {
                const result = JSON.parse(textResp);
                
                renderResult(
                    query, 
                    result.concept || "Concepto generado por IA. (Palabra compleja)", 
                    result.example || "El uso de esta palabra depende de su contexto específico.", 
                    result.synonyms && result.synonyms.length > 0 ? result.synonyms : ["Complejo", "Técnico"]
                );
                return; // Si todo salió bien, terminamos aquí.
            } catch (e) {
                console.warn("La IA no devolvió un JSON perfecto, se usará el respaldo.", e);
            }
        }

        // --- 2. Fallback: Diccionario Estándar (Free Dictionary API) ---
        const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/es/${normalizedQuery}`);
        if (dictResponse.ok) {
            const data = await dictResponse.json();
            const meaning = data[0].meanings[0];
            const def = meaning && meaning.definitions && meaning.definitions.length > 0 ? meaning.definitions[0] : null;
            
            if (def) {
                const concept = def.definition || "Concepto no encontrado de forma estándar.";
                const example = def.example || `Ejemplo no disponible para "${query}".`;
                
                let synonyms = [];
                if (data[0].meanings) {
                    data[0].meanings.forEach(m => {
                        if (m.synonyms && m.synonyms.length > 0) {
                            synonyms = synonyms.concat(m.synonyms);
                        }
                    });
                }
                
                if (synonyms.length === 0) synonyms = ["Común"];
                
                renderResult(query, concept, example, [...new Set(synonyms)].slice(0, 4));
                return;
            }
        }
        
        // --- 3. Fallback: Wikipedia API ---
        const wikiResponse = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${normalizedQuery}`);
        if (wikiResponse.ok) {
            const wikiData = await wikiResponse.json();
            if (wikiData.title && wikiData.extract) {
                renderResult(wikiData.title, wikiData.extract, `Consulta en Wikipedia: Búsqueda sobre ${wikiData.title}.`, ["Wikipedia", "Referencia"]);
                return;
            }
        }
        
        // --- 4. Fallback Local Limitado ---
        const localResult = lexiconDb[normalizedQuery];
        if (localResult) {
            renderResult(query, localResult.concept, localResult.example, localResult.synonyms);
            return;
        }
        
        // Si literalmente la IA, el diccionario y Wikipedia fallan, la palabra no existe o es inconexa.
        showError();
        
    } catch (error) {
        console.error("Error global en búsqueda:", error);
        const localResult = lexiconDb[normalizedQuery];
        if (localResult) {
            renderResult(query, localResult.concept, localResult.example, localResult.synonyms);
        } else {
            showError();
        }
    }
}

function renderResult(query, concept, example, synonyms) {
    loadingContainer.classList.add('hidden');
    
    // Construct the result
    wordTitle.textContent = query.trim();
    wordConcept.textContent = concept;
    wordExample.textContent = example;

    // Render Synonyms
    wordSynonyms.innerHTML = '';
    synonyms.forEach(syn => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = syn;
        wordSynonyms.appendChild(span);
    });

    // Setup Speech Synthesis
    audioBtn.onclick = () => {
        const utterance = new SpeechSynthesisUtterance(query);
        utterance.lang = 'es-ES';
        window.speechSynthesis.speak(utterance);
    };

    // Show result
    resultContainer.classList.remove('hidden');
    
    // Re-trigger animation
    resultContainer.style.animation = 'none';
    resultContainer.offsetHeight; // trigger reflow
    resultContainer.style.animation = null;
}

function showError() {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
}

// Add click on the suggestions in the error state
document.querySelectorAll('.error-state strong').forEach(el => {
    el.addEventListener('click', (e) => {
        const word = e.target.textContent.replace(',', '');
        searchInput.value = word;
        searchForm.dispatchEvent(new Event('submit'));
    });
});

// ─── REGISTRO DEL SERVICE WORKER (PWA) ────────────────────────────────────────
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => console.log('[VENBUSCA] Service Worker activo ✓'))
            .catch(err => console.log('[VENBUSCA] Error al registrar SW:', err));
    });
}
