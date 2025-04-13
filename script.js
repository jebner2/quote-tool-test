document.addEventListener('DOMContentLoaded', async () => {
    let products = {};

    // Placeholder base64 string for the Supportek logo (replace with actual base64 string)
    const supportekLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQ=='; // Replace this with the actual base64 string

    // Load and parse the products from products.csv
    try {
        const response = await fetch('products.csv');
        if (!response.ok) {
            throw new Error(`Failed to load products.csv: ${response.statusText}`);
        }
        const csvText = await response.text();
        products = parseCSV(csvText);
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load product data. Please ensure products.csv exists and is accessible.');
        return;
    }

    if (Object.keys(products).length === 0) {
        console.error('No products found in products.csv');
        alert('Failed to load product data. No products were found in products.csv.');
        return;
    }

    initializeApp();

    function parseCSV(csvText) {
        const result = {};
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return result; // Need at least a header and one data row

        // Parse headers (case-insensitive)
        const headers = parseCSVLine(lines[0]).map(header => header.toLowerCase());
        if (headers.length < 3 || headers[0] !== 'model' || headers[1] !== 'description' || headers[2] !== 'list price') {
            console.error('Invalid CSV header format. Expected: Model,Description,List Price (case-insensitive)');
            return result;
        }

        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Skip empty lines

            const values = parseCSVLine(line);
            if (values.length < 3) continue; // Skip malformed rows

            const model = values[0].trim();
            const description = values[1].trim();
            // Remove dollar sign and any spaces before parsing the list price
            const listPriceText = values[2].trim().replace('$', '').replace(/\s/g, '');
            const listPrice = parseFloat(listPriceText);

            if (model && description && !isNaN(listPrice)) {
                result[model] = { description, listPrice };
            }
        }

        return result;
    }

    // Helper function to parse a CSV line, handling quoted fields
    function parseCSVLine(line) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = i + 1 < line.length ? line[i + 1] : null;

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote within quoted field
                    currentValue += '"';
                    i++; // Skip the next quote
                } else {
                    inQuotes = !inQuotes; // Toggle quote state
                }
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }

        // Add the last value
        values.push(currentValue);
        return values;
    }

    function initializeApp() {
        const itemsContainer = document.getElementById('itemsContainer');
        const addItemBtn = document.getElementById('addItem');
        const generateQuoteBtn = document.getElementById('generateQuote');
        const quoteOutput = document.getElementById('quoteOutput');

        // Populate the datalist with model suggestions
        populateModelSuggestions();

        function populateModelSuggestions() {
            const datalist = document.getElementById('modelSuggestions');
            Object.keys(products).forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                datalist.appendChild(option);
            });
        }

        addItemBtn.addEventListener('click', () => {
            const newItem = itemsContainer.querySelector('.item').cloneNode(true);
            newItem.querySelector('.removeItem').style.display = 'block';
            newItem.querySelector('.customItem').checked = false;
            newItem.querySelector('.model').value = '';
            newItem.querySelector('.quantity').value = '1';
            newItem.querySelector('.description').value = '';
            newItem.querySelector('.listPrice').value = '';
            newItem.querySelector('.customerMultiplier').value = '0.9';
            newItem.querySelector('.quotedPrice').value = '';
            newItem.querySelector('.model').classList.remove('invalid');
            newItem.querySelector('.description').setAttribute('readonly', 'readonly');
            newItem.querySelector('.description').classList.remove('editable');
            newItem.querySelector('.listPrice').setAttribute('readonly', 'readonly');
            newItem.querySelector('.model').setAttribute('list', 'modelSuggestions');
            attachItemEventListeners(newItem);
            itemsContainer.appendChild(newItem);
        });

        function attachItemEventListeners(item) {
            const customItemCheckbox = item.querySelector('.customItem');
            const modelInput = item.querySelector('.model');
            const quantityInput = item.querySelector('.quantity');
            const descriptionTextarea = item.querySelector('.description');
            const listPriceInput = item.querySelector('.listPrice');
            const customerMultiplierInput = item.querySelector('.customerMultiplier');
            const quotedPriceInput = item.querySelector('.quotedPrice');
            const removeBtn = item.querySelector('.removeItem');

            customItemCheckbox.addEventListener('change', () => {
                if (customItemCheckbox.checked) {
                    // Custom item mode: make fields editable
                    modelInput.removeAttribute('list'); // Remove datalist for free text entry
                    descriptionTextarea.removeAttribute('readonly');
                    descriptionTextarea.classList.add('editable');
                    listPriceInput.removeAttribute('readonly');
                    modelInput.value = '';
                    descriptionTextarea.value = '';
                    listPriceInput.value = '';
                    quotedPriceInput.value = '';
                    modelInput.classList.remove('invalid');
                } else {
                    // Standard mode: use products.csv data
                    modelInput.setAttribute('list', 'modelSuggestions');
                    descriptionTextarea.setAttribute('readonly', 'readonly');
                    descriptionTextarea.classList.remove('editable');
                    listPriceInput.setAttribute('readonly', 'readonly');
                    modelInput.value = '';
                    descriptionTextarea.value = '';
                    listPriceInput.value = '';
                    quotedPriceInput.value = '';
                    modelInput.classList.remove('invalid');
                }
            });

            modelInput.addEventListener('input', () => {
                if (customItemCheckbox.checked) {
                    // Custom item: allow any model, ensure list price is a number
                    const listPrice = parseFloat(listPriceInput.value) || 0;
                    if (listPrice > 0) {
                        calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput);
                        modelInput.classList.remove('invalid');
                    } else {
                        quotedPriceInput.value = '';
                        modelInput.classList.add('invalid');
                    }
                } else {
                    // Standard item: lookup from products.csv
                    const enteredModel = modelInput.value.trim();
                    if (enteredModel && products[enteredModel]) {
                        descriptionTextarea.value = products[enteredModel].description;
                        listPriceInput.value = products[enteredModel].listPrice.toFixed(2);
                        calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput);
                        modelInput.classList.remove('invalid');
                    } else {
                        descriptionTextarea.value = '';
                        listPriceInput.value = '';
                        quotedPriceInput.value = '';
                        modelInput.classList.add('invalid');
                    }
                }
            });

            quantityInput.addEventListener('input', () => {
                calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput);
            });

            customerMultiplierInput.addEventListener('input', () => {
                calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput);
            });

            listPriceInput.addEventListener('input', () => {
                if (customItemCheckbox.checked) {
                    calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput);
                }
            });

            removeBtn.addEventListener('click', () => {
                if (itemsContainer.children.length > 1) {
                    item.remove();
                }
            });
        }

        function calculateQuotedPrice(listPriceInput, quantityInput, customerMultiplierInput, quotedPriceInput) {
            const listPrice = parseFloat(listPriceInput.value) || 0;
            const quantity = parseInt(quantityInput.value) || 1;
            const customerMultiplier = parseFloat(customerMultiplierInput.value) || 1;
            const totalListPrice = listPrice * quantity;
            const quotedPrice = totalListPrice * customerMultiplier;
            quotedPriceInput.value = quotedPrice.toFixed(2);
        }

        attachItemEventListeners(itemsContainer.querySelector('.item'));

        generateQuoteBtn.addEventListener('click', () => {
            const quoteNumber = document.getElementById('quoteNumber').value;
            const company = document.getElementById('company').value;
            const customerName = document.getElementById('customerName').value;
            const customerPhone = document.getElementById('customerPhone').value;
            const customerEmail = document.getElementById('customerEmail').value;
            const items = itemsContainer.querySelectorAll('.item');

            if (!quoteNumber || !company || !customerName) {
                alert('Please fill in all required fields: Quote Number, Company, and Customer Name.');
                return;
            }

            const today = new Date();
            const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

            let maxDescriptionLength = 0;
            items.forEach(item => {
                const description = item.querySelector('.description').value;
                if (description.length > maxDescriptionLength) {
                    maxDescriptionLength = description.length;
                }
            });
            const descriptionColumnWidth = Math.max(200, maxDescriptionLength * 5);

            let hasValidItem = false;
            let totalQuotedPrice = 0;
            let lineItemNumber = 1;
            let quoteTable = `
                <img src="supportek-logo.png" alt="Supportek Logo" class="logo">
                <div class="quote-header">
                    <h2>Quote for ${customerName}</h2>
                    <div class="date">Date: ${formattedDate}</div>
                </div>
                <div class="customer-info">
                    <p><strong>Quote Number:</strong> ${quoteNumber}</p>
                    <p><strong>Company:</strong> ${company}</p>
                    <p><strong>Customer Name:</strong> ${customerName}</p>
                    ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
                    ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
                </div>
                <table>
                    <tr>
                        <th>Line Item</th>
                        <th>Model</th>
                        <th>Quantity</th>
                        <th class="description-column" style="width: ${descriptionColumnWidth}px;">Description</th>
                        <th>List Price</th>
                        <th>Multiplier Adjustment</th>
                        <th>Quoted Price</th>
                    </tr>
            `;

            items.forEach(item => {
                const customItem = item.querySelector('.customItem').checked;
                const model = item.querySelector('.model').value.trim();
                const quantity = item.querySelector('.quantity').value;
                const description = item.querySelector('.description').value;
                const listPrice = item.querySelector('.listPrice').value;
                const customerMultiplier = item.querySelector('.customerMultiplier').value;
                const quotedPrice = item.querySelector('.quotedPrice').value;

                if (model && description && listPrice && quotedPrice) {
                    hasValidItem = true;
                    const totalListPrice = parseFloat(listPrice) * parseInt(quantity);
                    const multiplierAdjustment = parseFloat(quotedPrice) - totalListPrice;
                    totalQuotedPrice += parseFloat(quotedPrice);
                    quoteTable += `
                        <tr>
                            <td>${lineItemNumber}</td>
                            <td>${model}${customItem ? ' (Custom)' : ''}</td>
                            <td>${quantity}</td>
                            <td class="description-column" style="width: ${descriptionColumnWidth}px;">${description}</td>
                            <td>$${parseFloat(listPrice).toFixed(2)}</td>
                            <td>$${multiplierAdjustment.toFixed(2)}</td>
                            <td>$${parseFloat(quotedPrice).toFixed(2)}</td>
                        </tr>
                    `;
                    lineItemNumber++;
                }
            });

            if (!hasValidItem) {
                alert('Please add at least one valid item with a model, description, list price, and quoted price.');
                return;
            }

            quoteTable += `
                    <tr>
                        <td colspan="6" style="text-align: right;"><strong>Total Quoted Price:</strong></td>
                        <td><strong>$${totalQuotedPrice.toFixed(2)}</strong></td>
                    </tr>
                </table>
                <div class="contact-info">
                    <p><strong>Contact:</strong> Jordan Ebner, Branch Manager</p>
                    <p><strong>Phone:</strong> 720-289-4986</p>
                    <p><strong>Address:</strong> 230 Yuma Street, Denver, CO 80204</p>
                </div>
            `;

            quoteOutput.innerHTML = `
                <button id="exportPDF">Export to PDF</button>
                ${quoteTable}
            `;
            quoteOutput.style.display = 'block';

            const newExportPDFBtn = document.getElementById('exportPDF');
            newExportPDFBtn.addEventListener('click', () => {
                exportToPDF(quoteNumber, company, customerName, customerPhone, customerEmail, formattedDate, items, totalQuotedPrice);
            });
        });

        function exportToPDF(quoteNumber, company, customerName, customerPhone, customerEmail, formattedDate, items, totalQuotedPrice) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            doc.addImage(supportekLogoBase64, 'PNG', 10, 10, 50, 20);

            doc.setFontSize(16);
            doc.text(`Quote for ${customerName}`, 10, 40);
            doc.setFontSize(12);
            doc.text(`Date: ${formattedDate}`, 160, 40);

            let yPos = 50;
            doc.setFontSize(12);
            doc.text(`Quote Number: ${quoteNumber}`, 10, yPos);
            yPos += 10;
            doc.text(`Company: ${company}`, 10, yPos);
            yPos += 10;
            doc.text(`Customer Name: ${customerName}`, 10, yPos);
            if (customerPhone) {
                yPos += 10;
                doc.text(`Phone: ${customerPhone}`, 10, yPos);
            }
            if (customerEmail) {
                yPos += 10;
                doc.text(`Email: ${customerEmail}`, 10, yPos);
            }

            yPos += 20;
            const tableData = [];
            let lineItemNumber = 1;
            items.forEach(item => {
                const customItem = item.querySelector('.customItem').checked;
                const model = item.querySelector('.model').value.trim();
                const quantity = item.querySelector('.quantity').value;
                const description = item.querySelector('.description').value;
                const listPrice = item.querySelector('.listPrice').value;
                const quotedPrice = item.querySelector('.quotedPrice').value;

                if (model && description && listPrice && quotedPrice) {
                    const totalListPrice = parseFloat(listPrice) * parseInt(quantity);
                    const multiplierAdjustment = parseFloat(quotedPrice) - totalListPrice;
                    tableData.push([
                        lineItemNumber.toString(),
                        `${model}${customItem ? ' (Custom)' : ''}`,
                        quantity,
                        description,
                        `$${parseFloat(listPrice).toFixed(2)}`,
                        `$${multiplierAdjustment.toFixed(2)}`,
                        `$${parseFloat(quotedPrice).toFixed(2)}`
                    ]);
                    lineItemNumber++;
                }
            });

            doc.autoTable({
                startY: yPos,
                head: [['Line Item', 'Model', 'Quantity', 'Description', 'List Price', 'Multiplier Adjustment', 'Quoted Price']],
                body: tableData,
                styles: { fontSize: 10 },
                columnStyles: {
                    3: { cellWidth: 60 } // Adjust description column width (index 3)
                }
            });

            yPos = doc.lastAutoTable.finalY + 10;
            doc.text(`Total Quoted Price: $${totalQuotedPrice.toFixed(2)}`, 150, yPos);

            yPos += 10;
            doc.setFontSize(10);
            doc.text('Contact: Jordan Ebner, Branch Manager', 10, yPos);
            yPos += 5;
            doc.text('Phone: 720-289-4986', 10, yPos);
            yPos += 5;
            doc.text('Address: 230 Yuma Street, Denver, CO 80204', 10, yPos);

            doc.save(`Quote_${quoteNumber}_${formattedDate.replace(/\//g, '-')}.pdf`);
        }
    }
});
