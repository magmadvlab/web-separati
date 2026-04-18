# Guida al Diario Salute

**Data**: 30 Gennaio 2026, 21:45 CET

---

## 📔 Cosa Si Può Registrare nel Diario Salute

### 🎯 Categorie Disponibili

Il Diario Salute permette di registrare 4 tipi di voci:

#### 1. 🤒 Sintomo
**Quando usarlo**: Per registrare sintomi fisici o malesseri

**Esempi**:
- Mal di testa
- Febbre
- Dolore addominale
- Nausea
- Vertigini
- Affaticamento
- Dolori articolari
- Tosse
- Difficoltà respiratorie

**Campi**:
- **Titolo**: Nome del sintomo
- **Contenuto**: Descrizione dettagliata (intensità, durata, caratteristiche)
- **Data Evento**: Quando si è manifestato
- **Note**: Eventuali fattori scatenanti, cosa ha aiutato

**Esempio Pratico**:
```
Titolo: Mal di testa intenso
Contenuto: Dolore pulsante nella zona frontale, intensità 7/10.
          Iniziato alle 14:00, durato circa 3 ore.
Data: 30/01/2026
Note: Possibile causa: stress lavorativo. Migliorato con paracetamolo.
```

---

#### 2. 📅 Evento
**Quando usarlo**: Per registrare eventi medici o sanitari importanti

**Esempi**:
- Visita medica
- Esame diagnostico
- Ricovero ospedaliero
- Intervento chirurgico
- Vaccinazione
- Cambio terapia
- Inizio nuova cura
- Reazione allergica
- Incidente/trauma

**Campi**:
- **Titolo**: Tipo di evento
- **Contenuto**: Dettagli dell'evento (dove, con chi, risultati)
- **Data Evento**: Quando è avvenuto
- **Note**: Esito, prescrizioni ricevute, follow-up

**Esempio Pratico**:
```
Titolo: Visita cardiologica
Contenuto: Controllo annuale presso Ospedale San Raffaele.
          ECG normale, pressione 120/80.
          Medico: Dr. Rossi
Data: 28/01/2026
Note: Tutto nella norma. Prossimo controllo tra 12 mesi.
```

---

#### 3. 📝 Nota
**Quando usarlo**: Per annotazioni generali sulla salute

**Esempi**:
- Cambiamenti nello stile di vita
- Osservazioni sul benessere generale
- Effetti di nuove abitudini
- Monitoraggio peso/dieta
- Qualità del sonno
- Livelli di energia
- Umore e benessere mentale
- Promemoria personali

**Campi**:
- **Titolo**: Oggetto della nota
- **Contenuto**: Testo libero
- **Data Evento**: Data di riferimento
- **Note**: Informazioni aggiuntive

**Esempio Pratico**:
```
Titolo: Inizio dieta mediterranea
Contenuto: Iniziato nuovo regime alimentare consigliato dal nutrizionista.
          Obiettivo: ridurre colesterolo.
          Menu tipo: colazione con frutta, pranzo con verdure e pesce,
          cena leggera.
Data: 25/01/2026
Note: Peso iniziale: 78kg. Controllo tra 1 mese.
```

---

#### 4. 🔖 Altro
**Quando usarlo**: Per tutto ciò che non rientra nelle altre categorie

**Esempi**:
- Informazioni da ricordare
- Domande per il medico
- Ricerche personali
- Consigli ricevuti
- Appunti vari

---

## 📊 Campi Disponibili

### Campi Obbligatori
1. **Titolo** (max 255 caratteri)
   - Breve descrizione dell'evento/sintomo
   - Deve essere chiaro e identificativo

2. **Contenuto** (testo lungo)
   - Descrizione dettagliata
   - Può includere:
     - Sintomi specifici
     - Intensità (scala 1-10)
     - Durata
     - Fattori scatenanti
     - Cosa ha aiutato/peggiorato

3. **Categoria**
   - Sintomo / Evento / Nota / Altro

4. **Data Evento**
   - Quando è avvenuto
   - Può essere diversa dalla data di registrazione

### Campi Opzionali
5. **Tag** (array di stringhe)
   - Parole chiave per categorizzare
   - Esempi: "urgente", "cronico", "allergia", "farmaco"
   - Utili per filtrare e cercare

6. **Note** (testo lungo)
   - Informazioni aggiuntive
   - Osservazioni successive
   - Follow-up

---

## 🔍 Funzionalità di Ricerca e Filtro

### Ricerca Testuale
- Cerca in titolo, contenuto e note
- Minimo 3 caratteri
- Ricerca in tempo reale

### Filtro per Categoria
- Tutte le categorie
- Solo Sintomi
- Solo Eventi
- Solo Note
- Solo Altro

### Filtro per Tag
- Inserisci tag per filtrare
- Mostra solo voci con quel tag

---

## 💡 Casi d'Uso Pratici

### 1. Monitoraggio Sintomi Cronici
```
Titolo: Dolore lombare
Categoria: Sintomo
Tag: cronico, schiena
Contenuto: Dolore zona lombare destra, intensità 5/10.
          Peggiora dopo essere stato seduto a lungo.
Note: Provare esercizi di stretching consigliati dal fisioterapista.
```

### 2. Tracciamento Effetti Collaterali Farmaci
```
Titolo: Nausea dopo nuovo farmaco
Categoria: Sintomo
Tag: farmaco, effetto-collaterale
Contenuto: Nausea lieve dopo assunzione Metformina.
          Iniziata 30 minuti dopo la dose mattutina.
Note: Provare ad assumere durante i pasti come suggerito.
```

### 3. Diario Pressione Arteriosa
```
Titolo: Misurazione pressione
Categoria: Nota
Tag: pressione, monitoraggio
Contenuto: Mattina: 125/82 mmHg
          Sera: 130/85 mmHg
          Frequenza cardiaca: 72 bpm
Note: Valori nella norma. Continuare monitoraggio giornaliero.
```

### 4. Preparazione Visita Medica
```
Titolo: Domande per il cardiologo
Categoria: Altro
Tag: visita, domande
Contenuto: 
- Posso aumentare attività fisica?
- Dosaggio farmaco pressione è corretto?
- Quando ripetere ecocardiogramma?
Note: Visita programmata per il 15/02/2026
```

---

## 📱 Dove Trovare il Diario

### Opzione 1: Cartella Clinica (Principale)
1. Menu → "Cartella Clinica"
2. Tab → "Diario"
3. Pulsante "Nuova Voce"

### Opzione 2: Pagina Salute
1. Vai a `/salute`
2. Sezione "Diari Misurazioni"

---

## 🎯 Best Practices

### ✅ Cosa Fare
- Registrare sintomi appena si manifestano
- Essere specifici e dettagliati
- Usare tag per categorizzare
- Aggiornare note con follow-up
- Registrare data evento corretta
- Includere intensità sintomi (scala 1-10)

### ❌ Cosa Evitare
- Titoli generici ("male", "problema")
- Contenuti troppo brevi
- Dimenticare la data evento
- Non usare tag
- Registrare tutto come "Altro"

---

## 📊 Statistiche e Export

### Funzionalità Disponibili
- Ricerca full-text
- Filtro per categoria
- Filtro per tag
- Filtro per data
- Modifica voci esistenti
- Eliminazione voci

### Funzionalità Future
- Export PDF
- Grafici trends
- Condivisione con medico
- Promemoria automatici
- Analisi AI sintomi

---

## 🔒 Privacy e Sicurezza

- Tutti i dati sono criptati
- Accessibili solo al paziente
- Possibile condivisione con medici autorizzati
- Backup automatico
- Conformità GDPR

---

## 💡 Suggerimenti Utili

### Per Sintomi Ricorrenti
Crea una voce per ogni episodio con stesso tag:
```
Tag: emicrania
```
Così puoi filtrare e vedere la frequenza.

### Per Monitoraggio Terapie
Registra effetti e miglioramenti:
```
Titolo: Settimana 2 nuova terapia
Categoria: Nota
Tag: terapia, monitoraggio
```

### Per Preparare Visite
Raccogli domande e sintomi:
```
Categoria: Altro
Tag: visita-prossima
```

---

## 📞 Supporto

Per domande o problemi:
- Menu → "Supporto"
- Crea ticket di supporto
- Risposta entro 24h

---

**Il Diario Salute è il tuo alleato per tracciare e gestire la tua salute!** 📔✨
