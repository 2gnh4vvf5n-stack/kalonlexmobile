/* ============================================================
   KALONLEX MOBILE — SCRIPT DE BASE (CORRIGÉ & COMPATIBLE PWA)
   ============================================================ */

/* ------------------------------------------------------------
   ÉTAT GLOBAL
------------------------------------------------------------ */
let lexique = [];
let currentWordId = null;
const kalonAlphabet = [
    "A","B","C","D","E","Ë","F","G","I","J","K","L","M","N","O","Ø","P","Q","R","S","Š","T","U","Ü","V","Z","Ž"
];
const VOWELS = ["a","e","i","o","u","ø","ë","ü"];

const categories = {
    "Nom": [
        "commun", "propre", "concret", "abstrait",
        "comptable", "incomptable", "individuel",
        "collectif", "animé", "inanimé"
    ],
    "Verbe": [
        "monovalent", "bivalent", "trivalent",
        "dynamique", "statique", "auxiliaire"
    ],
    "Adjectif": [
        "qualificatif", "relationnel"
    ],
    "Adverbe": [
        "de manière", "de temps", "de lieu",
        "de quantité", "modalisateur"
    ],
    "Pronom": [
        "personnel", "démonstratif", "indéfini",
        "interrogatif", "relatif", "réfléchi"
    ],
    "Déterminant": [
        "démonstratif", "quantifieur indéfini",
        "numéral cardinal", "numéral ordinal",
        "interrogatif", "exclamatif"
    ],
    "Connecteur": [
        "préposition", "conjonction de subordination",
        "conjonction de coordination"
    ]
};

/* ------------------------------------------------------------
   INITIALISATION GLOBALE (SÉCURISÉE)
------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    init();
    setupSidebarUI();
});

function init() {
    loadLexicon();
    setupSearch();
    setupButtons();
    
    const mainCategorySelect = document.getElementById("mainCategory");
    if (mainCategorySelect) {
        populateMainCategory();
        mainCategorySelect.addEventListener("change", handleCategoryChange);
    }

    const wordForm = document.getElementById("wordForm");
    if (wordForm) {
        wordForm.addEventListener("submit", handleFormSubmit);
    }

    showView("welcome");
}

/* ------------------------------------------------------------
   GESTION DES VUES
------------------------------------------------------------ */
function showView(viewName) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.remove("active"));

    const target = document.getElementById(viewName + "View");
    if (target) target.classList.add("active");
}

/* ------------------------------------------------------------
   CHARGEMENT / SAUVEGARDE DU LEXIQUE
------------------------------------------------------------ */
function loadLexicon() {
    const data = localStorage.getItem("kalonlex_mobile");
    lexique = data ? JSON.parse(data) : [];
    renderWordList(lexique);
}

function saveLexicon() {
    localStorage.setItem("kalonlex_mobile", JSON.stringify(lexique));
}

/* ------------------------------------------------------------
   AFFICHAGE DE LA LISTE DES MOTS (SIDEBAR)
------------------------------------------------------------ */
function renderWordList(list) {
    const container = document.getElementById("wordList");
    if (!container) return;
    container.innerHTML = "";

    const groups = {};

    // Regrouper les mots par première lettre (avec déduplication par ID par sécurité)
    const seenIds = new Set();
    list.forEach(word => {
        if (!word.lemme || seenIds.has(word.id)) return;
        seenIds.add(word.id);

        const letter = word.lemme[0].toUpperCase();
        if (!groups[letter]) groups[letter] = [];
        groups[letter].push(word);
    });

    // Créer toutes les lettres de l'alphabet kalonnien
    kalonAlphabet.forEach(letter => {
        const section = document.createElement("li");
        section.classList.add("alpha-section");

        // Header (flèche de droite supprimée)
        const header = document.createElement("div");
        header.classList.add("alpha-header");
        const count = groups[letter] ? groups[letter].length : 0;
        
        header.innerHTML = `
            <span class="letter-title">${letter}</span>
            <span class="count">(${count})</span>
        `;
        section.appendChild(header);

        // Liste des mots
        const ul = document.createElement("ul");
        ul.classList.add("alpha-words");

        if (groups[letter]) {
            groups[letter].forEach(word => {
                const li = document.createElement("li");
                li.classList.add("word-item");

                li.innerHTML = `
                    <span class="word-lemma">${word.lemme}</span>
                    <span class="word-trad">${word.traduction || ""}</span>
                `;

                li.addEventListener("click", () => {
                    selectWord(word.id);
                    document.querySelector(".sidebar")?.classList.remove("visible");
                });

                ul.appendChild(li);
            });
        }

        section.appendChild(ul);

        // Toggle avec centrage dynamique
        header.addEventListener("click", () => {
            const isOpen = section.classList.contains("open");
            section.classList.toggle("open", !isOpen);

            if (!isOpen) {
                section.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        });

        container.appendChild(section);
    });
}

/* ------------------------------------------------------------
   FORMULAIRES & CATÉGORIES
------------------------------------------------------------ */
function populateMainCategory() {
    const select = document.getElementById("mainCategory");
    if (!select) return;
    select.innerHTML = '<option value="">-- Choisir une catégorie --</option>';
    Object.keys(categories).forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        select.appendChild(opt);
    });
}

function handleCategoryChange() {
    const container = document.getElementById("subCategoriesContainer");
    if (!container) return;
    container.innerHTML = "";

    const selected = document.getElementById("mainCategory").value;
    if (!selected || !categories[selected]) return;

    categories[selected].forEach(sub => {
        const div = document.createElement("div");
        div.classList.add("subcat-item");

        div.innerHTML = `
            <label>
                <input type="checkbox" name="subCategories" value="${sub}">
                ${sub}
            </label>
        `;
        container.appendChild(div);
    });
}

/* ------------------------------------------------------------
   SÉLECTION D’UN MOT & DÉTAILS
------------------------------------------------------------ */
function selectWord(id) {
    const word = lexique.find(w => w.id === id);
    if (!word) return;

    currentWordId = id;

    document.getElementById("detLemme").textContent = word.lemme;
    document.getElementById("detTraduction").textContent = word.traduction || "—";
    document.getElementById("detailCategory").textContent = word.mainCategory || "—";
    document.getElementById("detailSubCategories").textContent = word.subCategories?.join(", ") || "—";
    
    // Affichage optionnel des champs riches (exemples, synonymes, notes)
    const examplesContainer = document.getElementById("detExemples");
    if (examplesContainer) {
        examplesContainer.innerHTML = word.exemples?.length ? word.exemples.map(ex => `<li>${ex}</li>`).join("") : "—";
    }

    const synoContainer = document.getElementById("detSynonymes");
    if (synoContainer) {
        synoContainer.textContent = word.synonymes?.join(", ") || "—";
    }

    const notesContainer = document.getElementById("detNotes");
    if (notesContainer) {
        notesContainer.textContent = word.notes || "—";
    }

    // Gestion des tableaux morphologiques dynamiques
    const dynContainer = document.getElementById("dynamicTablesContainer");
    if (dynContainer) {
        dynContainer.innerHTML = "";
        if (word.mainCategory === "Nom") generateNomTables(word, dynContainer);
        if (word.mainCategory === "Verbe") generateVerbeTables(word, dynContainer);
        if (word.mainCategory === "Adjectif") generateAdjectifTables(word, dynContainer);
        if (word.mainCategory === "Pronom") generateSinglePronounTable(word, dynContainer);
        if (word.mainCategory === "Déterminant") generateDeterminantDemoTable(word, dynContainer);
    }

    showView("detail");
}

/* ------------------------------------------------------------
   MOTEUR MORPHOLOGIQUE (Règles inchangées)
------------------------------------------------------------ */
function getVerbGroup(lemme) {
    if (lemme.endsWith("ëžt")) return 1;
    if (lemme.endsWith("at")) return 2;
    return null;
}

function getVerbRadical(lemme) {
    if (lemme.endsWith("ëžt")) return lemme.slice(0, -3);
    if (lemme.endsWith("at")) return lemme.slice(0, -2);
    return lemme;
}

const PRESENT = {
    1: ["tum","tam","tem","tumen","tamen","temen"],
    2: ["vus","vas","ves","vusen","vasen","vesen"]
};
const PAST = {
    1: ["jug","jag","jeg","jugen","jagen","jegen"],
    2: ["žug","žag","žeg","žugen","žagen","žegen"]
};
const FUTURE = {
    1: ["dud","dad","ded","duden","daden","deden"],
    2: ["šud","šad","šed","šuden","šaden","šeden"]
};
const PERSONS = ["Møj","Tej","Džu / Adžu / Jal","Krat","Bis","Džen / Adžen / Jalen"];

function generateVerbTable(title, radical, suffixes, container) {
    const table = document.createElement("table");
    table.classList.add("morpho-table");
    table.innerHTML = `
        <thead>
            <tr><th colspan="2">${title}</th></tr>
            <tr><th>Personne</th><th>Forme</th></tr>
        </thead>
        <tbody>
            ${suffixes.map((suf, i) => `
                <tr>
                    <td>${PERSONS[i]}</td>
                    <td class="copyable">${applyOrthography(radical, suf)}</td>
                </tr>
            `).join("")}
        </tbody>
    `;
    container.appendChild(table);
}

function generateVerbeTables(word, container) {
    const group = getVerbGroup(word.lemme);
    if (!group) return;
    const radical = getVerbRadical(word.lemme);
    generateVerbTable("Présent", radical, PRESENT[group], container);
    generateVerbTable("Passé", radical, PAST[group], container);
    generateVerbTable("Futur", radical, FUTURE[group], container);
}

function applyOrthography(base, suffix) {
    if (!base || !suffix) return base + suffix;
    const last3 = base.slice(-3);
    const last2 = base.slice(-2);
    const last = base.slice(-1);
    const suffixFirst = suffix[0];
    const isLastVowel = VOWELS.includes(last);
    const isSuffixConsonant = !VOWELS.includes(suffixFirst);

    if (last3.length === 3 && !VOWELS.includes(last3[0]) && VOWELS.includes(last3[1]) && VOWELS.includes(last3[2])) {
        return base.slice(0, -2) + suffix;
    }
    if (last2.length === 2 && !VOWELS.includes(last2[0]) && VOWELS.includes(last2[1])) {
        return base.slice(0, -1) + suffix;
    }
    if (!isLastVowel && isSuffixConsonant) {
        return base + "a" + suffix;
    }
    return base + suffix;
}

// (Tables Noms, Adjectifs, Pronoms et Déterminants maintenues à l'identique de ta logique initiale)
const ADJ_INAN = [
    ["Nominatif", "", "en"], ["Accusatif", "ej", "ejen"], ["Génitif", "aj", "ajen"],
    ["Datif", "em", "emen"], ["Instrumental", "es", "esen"], ["Locatif", "et", "eten"],
    ["Directif", "er", "eren"], ["Ablatif", "øn", "ønen"], ["Volitif", "ex", "exen"],
    ["Comitatif", "ek", "eken"], ["Essif", "an", "anen"], ["Privatif", "at", "aten"]
];
const ADJ_ANIM = [
    ["Nominatif", "ii", "ien"], ["Accusatif", "ij", "ijen"], ["Génitif", "ija", "iji"],
    ["Datif", "im", "imen"], ["Instrumental", "is", "isen"], ["Locatif", "it", "iten"],
    ["Directif", "ir", "iren"], ["Ablatif", "øn", "ønen"], ["Volitif", "ix", "ixen"],
    ["Comitatif", "ik", "iken"], ["Essif", "in", "inen"], ["Privatif", "at", "aten"]
];

function deriveAnimateAdjective(base) {
    if (base.endsWith("ska")) return base.slice(0, -3) + "skii";
    return base + "skii";
}

function generateAdjectifTables(word, container) {
    const base = word.lemme;
    const animateBase = deriveAnimateAdjective(base);
    
    const tableInan = document.createElement("table");
    tableInan.classList.add("morpho-table");
    tableInan.innerHTML = `<thead><tr><th colspan="3">Inanimé</th></tr><tr><th>Cas</th><th>Singulier</th><th>Pluriel</th></tr></thead><tbody>` +
        ADJ_INAN.map(r => `<tr><td>${r[0]}</td><td class="copyable">${applyOrthography(base, r[1])}</td><td class="copyable">${applyOrthography(base, r[2])}</td></tr>`).join("") + `</tbody>`;
    container.appendChild(tableInan);

    const tableAnim = document.createElement("table");
    tableAnim.classList.add("morpho-table");
    tableAnim.innerHTML = `<thead><tr><th colspan="3">Animé</th></tr><tr><th>Cas</th><th>Singulier</th><th>Pluriel</th></tr></thead><tbody>` +
        ADJ_ANIM.map(r => `<tr><td>${r[0]}</td><td class="copyable">${applyOrthography(animateBase, r[1].replace("-skii", ""))}</td><td class="copyable">${applyOrthography(animateBase, r[2].replace("-skien", ""))}</td></tr>`).join("") + `</tbody>`;
    container.appendChild(tableAnim);
}

function generateNomTables(word, container) {
    const cases = [
        ["Nominatif", "", "en"], ["Accusatif", "øj", "øjen"], ["Génitif", "aj", "ajen"],
        ["Datif", "øm", "ømi"], ["Instrumental", "es", "esen"], ["Locatif", "øt", "it"],
        ["Directif", "er", "ir"], ["Ablatif", "øn", "øni"], ["Volitif", "ux", "uxen"],
        ["Comitatif", "ak", "aken"], ["Essif", "in", "inen"], ["Privatif", "at", "aten"]
    ];
    const table = document.createElement("table");
    table.classList.add("morpho-table");
    table.innerHTML = `<thead><tr><th>Cas</th><th>Singulier</th><th>Pluriel</th></tr></thead><tbody>` +
        cases.map(c => `<tr><td>${c[0]}</td><td class="copyable">${applyOrthography(word.lemme, c[1])}</td><td class="copyable">${applyOrthography(word.lemme, c[2])}</td></tr>`).join("") + `</tbody>`;
    container.appendChild(table);
}

const PRONOUNS = {
    "Møj": { nominatif: "Møj", accusatif: "Møje", genitif: "Minja", datif: "Møjem", instrumental: "Møjes", locatif: "Mø", directif: "Mer", ablatif: "Møn", volitif: "Ix", comitatif: "Mek", essif: "Mijn", privatif: "Mija" },
    "Tej": { nominatif: "Tej", accusatif: "Tje", genitif: "Tebja", datif: "Tijem", instrumental: "Tijes", locatif: "Tø", directif: "Ter", ablatif: "Tøn", volitif: "Dex", comitatif: "Tek", essif: "Tijn", privatif: "Tija" }
};
function generateSinglePronounTable(word, container) {
    const forms = PRONOUNS[word.lemme];
    if (!forms) return;
    const table = document.createElement("table");
    table.classList.add("morpho-table");
    table.innerHTML = `<thead><tr><th colspan="2">Pronom</th></tr></thead><tbody>` +
        Object.entries(forms).map(([c, f]) => `<tr><td>${c}</td><td class="copyable">${f}</td></tr>`).join("") + `</tbody>`;
    container.appendChild(table);
}

const DETERMINANTS_DEMO = {
    "Etø": { nominatif: "Etø", accusatif: "Etøj", genitif: "Eta", datif: "Etøm", instrumental: "Etes", locatif: "Etøt", directif: "Eter", ablatif: "Etøn", volitif: "Etux", comitatif: "Etak", essif: "Etin", privatif: "Etat" }
};
function generateDeterminantDemoTable(word, container) {
    const forms = DETERMINANTS_DEMO[word.lemme];
    if (!forms) return;
    const table = document.createElement("table");
    table.classList.add("morpho-table");
    table.innerHTML = `<thead><tr><th colspan="2">Déterminant Démonstratif</th></tr></thead><tbody>` +
        Object.entries(forms).map(([c, f]) => `<tr><td>${c}</td><td class="copyable">${f}</td></tr>`).join("") + `</tbody>`;
    container.appendChild(table);
}

/* ------------------------------------------------------------
   GESTION DU FORMULAIRE ET SOUMISSION
------------------------------------------------------------ */
function getFormData() {
    return {
        id: document.getElementById("formId").value.trim(),
        lemme: document.getElementById("formLemme").value.trim(),
        traduction: document.getElementById("formTraduction").value.trim(),
        synonymes: document.getElementById("formSynonymes").value.split(",").map(s => s.trim()).filter(s => s),
        exemples: document.getElementById("formExemples").value.split("\n").map(e => e.trim()).filter(e => e),
        notes: document.getElementById("formNotes").value.trim(),
        mainCategory: document.getElementById("mainCategory").value,
        subCategories: Array.from(document.querySelectorAll("input[name='subCategories']:checked")).map(cb => cb.value)
    };
}

function handleFormSubmit(e) {
    e.preventDefault();
    const data = getFormData();

    if (!data.lemme || !data.traduction) {
        alert("Lemme et traduction obligatoires.");
        return;
    }

    if (!data.id) {
        // Nouveau mot : on génère un ID unique
        data.id = Date.now().toString();
        lexique.push(data);
    } else {
        // Modification d'un mot existant
        const index = lexique.findIndex(w => w.id === data.id);
        if (index !== -1) {
            lexique[index] = data;
        } else {
            lexique.push(data);
        }
    }

    saveLexicon();
    renderWordList(lexique);
    selectWord(data.id);
}

function fillFormFromWord(word) {
    document.getElementById("formId").value = word.id;
    document.getElementById("formLemme").value = word.lemme;
    document.getElementById("formTraduction").value = word.traduction || "";
    document.getElementById("formSynonymes").value = word.synonymes?.join(", ") || "";
    document.getElementById("formExemples").value = word.exemples?.join("\n") || "";
    document.getElementById("formNotes").value = word.notes || "";
    
    const mainCatSelect = document.getElementById("mainCategory");
    mainCatSelect.value = word.mainCategory || "";
    mainCatSelect.dispatchEvent(new Event('change'));

    setTimeout(() => {
        if (word.subCategories) {
            document.querySelectorAll("input[name='subCategories']").forEach(cb => {
                if (word.subCategories.includes(cb.value)) cb.checked = true;
            });
        }
    }, 50);
}

function resetForm() {
    const form = document.getElementById("wordForm");
    if (form) form.reset();
    document.getElementById("formId").value = "";
    document.getElementById("subCategoriesContainer").innerHTML = "";
}

/* ------------------------------------------------------------
   BOUTONS DE NAVIGATION & UI SIDEBAR (Correction du bug .submit())
------------------------------------------------------------ */
function setupButtons() {
    document.getElementById("btnNewWord")?.addEventListener("click", () => {
        resetForm();
        showView("form");
        document.querySelector(".sidebar")?.classList.remove("visible");
    });

    // CORRECTION CRITIQUE : Empêcher le rechargement de page natif avec .submit()
    // Bouton de sauvegarde
    document.getElementById("saveBtn")?.addEventListener("click", (e) => {
        const form = document.getElementById("wordForm");
        if (form && !form.reportValidity()) {
            e.preventDefault();
        }
    });

    document.getElementById("cancelBtn")?.addEventListener("click", () => {
        showView("welcome");
    });

    document.getElementById("btnBackHome")?.addEventListener("click", () => {
        showView("welcome");
    });

    document.getElementById("btnEdit")?.addEventListener("click", () => {
        if (!currentWordId) return;
        const word = lexique.find(w => w.id === currentWordId);
        fillFormFromWord(word);
        showView("form");
    });

    document.getElementById("btnDelete")?.addEventListener("click", () => {
        if (!currentWordId) return;
        if (confirm("Voulez-vous vraiment supprimer ce mot ?")) {
            lexique = lexique.filter(w => w.id !== currentWordId);
            saveLexicon();
            renderWordList(lexique);
            showView("welcome");
        }
    });

    // Bouton "tout déplier"
    document.getElementById("btnOpenAll")?.addEventListener("click", () => {
        document.querySelectorAll(".alpha-section").forEach(section => {
            section.classList.add("open");
        });
    });

    // Bouton "tout replier"
    document.getElementById("btnCloseAll")?.addEventListener("click", () => {
        document.querySelectorAll(".alpha-section").forEach(section => {
            section.classList.remove("open");
        });
    });

    // Bouton "Top" pour remonter tout en haut de la liste de la sidebar
    document.getElementById("btnTop")?.addEventListener("click", () => {
        const sidebarList = document.getElementById("wordList");
        if (sidebarList) {
            sidebarList.scrollTo({ top: 0, behavior: "smooth" });
        }
    });
}

function setupSidebarUI() {
    const sidebar = document.querySelector(".sidebar");
    const toggleBtn = document.getElementById("toggleSidebarBtn");

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener("click", () => {
            sidebar.classList.toggle("visible");
        });
    }
}

/* ------------------------------------------------------------
   COPIER-COLLER (Unifié sans doublon)
------------------------------------------------------------ */
document.addEventListener("click", (e) => {
    if (e.target.classList.contains("copyable")) {
        const text = e.target.textContent.trim();
        navigator.clipboard.writeText(text);
        showCopyFeedback(e.target);
    }
});

function showCopyFeedback(element) {
    const bubble = document.createElement("div");
    bubble.textContent = "Copié !";
    bubble.className = "copyBubble";
    element.style.position = "relative";
    element.appendChild(bubble);
    setTimeout(() => bubble.remove(), 700);
}

/* ------------------------------------------------------------
   RECHERCHE INSTANTANÉE
------------------------------------------------------------ */
function setupSearch() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    searchInput.addEventListener("input", (e) => {
        const q = e.target.value.toLowerCase().trim();

        if (!q.length) {
            renderWordList(lexique);
            return;
        }

        const filtered = lexique.filter(w =>
            w.lemme.toLowerCase().includes(q) ||
            (w.traduction || "").toLowerCase().includes(q)
        );

        renderWordList(filtered);
    });
}
// Enregistrement du Service Worker pour la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker enregistré avec succès :', reg.scope))
            .catch(err => console.log('Échec de l\'enregistrement du Service Worker :', err));
    });
}
document.getElementById('word-count').textContent = `(${lexique.length} entrées)`;