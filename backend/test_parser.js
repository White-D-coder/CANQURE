const parseMedicines = (text) => {
    const lines = text.split('\n');
    const medicines = [];
    const seenNames = new Set();

    const medicinePatterns = /(tablet|cap|capsule|syr|syrup|inj|injection|pill|tab|drop|drops|ointment|cream|gel|lotion)\b/i;
    const dosagePattern = /(\d+(?:\.\d+)?\s*(?:mg|g|ml|mcg|iu|%|v\/v|w\/v))/i;
    const frequencyPattern = /(\d+-\d+-\d+|\b(?:once|twice|thrice|daily|od|bd|bid|tid|qid|sos)\b)/i;
    const ignoreList = /(patient|doctor|clinic|hospital|date|age|gender|weight|blood|pressure|scan|report|name|dr\.)\b/i;

    lines.forEach((line, index) => {
        let trimmed = line.trim();
        if (trimmed.length < 4 || ignoreList.test(trimmed)) return;

        trimmed = trimmed.replace(/^[\d\.\-\)\>]+\s*/, '');

        const hasDosage = dosagePattern.test(trimmed);
        const hasForm = medicinePatterns.test(trimmed);
        const hasFrequency = frequencyPattern.test(trimmed);

        if (hasDosage || hasForm || hasFrequency) {
            let name = trimmed;

            const dosageMatch = trimmed.match(dosagePattern);
            if (dosageMatch && dosageMatch.index > 0) {
                name = trimmed.substring(0, dosageMatch.index).trim();
            } else if (hasForm && !dosageMatch) {
                const formMatchStart = trimmed.search(medicinePatterns);
                if (formMatchStart > 0) {
                    name = trimmed.substring(0, formMatchStart + trimmed.match(medicinePatterns)[0].length).trim();
                }
            } else {
                const freqMatch = trimmed.match(frequencyPattern);
                if (freqMatch && freqMatch.index > 0) {
                    name = trimmed.substring(0, freqMatch.index).trim();
                } else {
                    name = trimmed.split(/\s\d/)[0].trim() || trimmed;
                }
            }

            name = name.replace(/[^a-zA-Z\s\-]/g, '').trim();

            if (name.length > 2 && !seenNames.has(name.toLowerCase())) {
                seenNames.add(name.toLowerCase());

                medicines.push({
                    id: index,
                    name: name || trimmed,
                    originalText: trimmed,
                    timing: hasFrequency ? (trimmed.match(frequencyPattern)?.[0] || 'Daily') : 'Daily',
                    dosage: hasDosage ? trimmed.match(dosagePattern)?.[0] : 'As prescribed'
                });
            }
        }
    });

    return medicines;
};

const text = `
Dr. Smith Medical Clinic
Patient: John Doe

Prescriptions:
1. Paracetamol 500mg - 1-1-1
2. Amoxicillin capsule 250 mg twice daily
3. Cough Syrup 10ml thrice
4. Vitamin C
5. Dolo-650 mg SOS
`;

console.log(parseMedicines(text));
