document.addEventListener('DOMContentLoaded', () => {
    let products = {};

    // Placeholder base64 string for the Supportek logo (replace with actual base64 string)
    const supportekLogoBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // Replace this with the actual base64 string

    // Fetch and parse the HTM file
    fetch('pricing.fld/sheet001.htm')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load sheet001.htm');
            }
            return response.text();
        })
        .then(data => {
            // Parse the HTM data
            products = parseHTM(data);
            if (Object.keys(products).length === 0) {
                throw new Error('No products found in sheet001.htm');
            }
            initializeApp();
        })
        .catch(error => {
            console.error('Error loading HTM:', error);
            alert('Failed to load product data. Please ensure sheet001.htm is in the correct directory and the server is running.');
        });

    function parseHTM(htmText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmText, 'text/html');
        const result = {};

        // Find all rows in the table
        const rows = doc.querySelectorAll('table tr');
        let isDataRow = false; // Flag to indicate if we're in a data section

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');

            // Skip rows that don't have exactly 23 cells (e.g., hidden rows or malformed rows)
            if (cells.length !== 23) return;

            // Check if this is a header row
            const firstCellText = cells[0].textContent.trim().toLowerCase();
            if (firstCellText === 'model') {
                isDataRow = true; // Start processing data rows after this header
                return; // Skip the header row itself
            }

            // Skip empty rows (where the first cell has colspan=23)
            if (cells[0].hasAttribute('colspan') && cells[0].getAttribute('colspan') === '23') {
                isDataRow = false; // End the current data section
                return;
            }

            // Process data rows
            if (isDataRow) {
                const model = cells[0].textContent.trim();
                // Extract the full description, including hidden text
                const descriptionNode = cells[1];
                const description = descriptionNode.textContent.trim(); // textContent includes hidden text
                // Clean the list price (remove "$" and extra spaces, convert to float)
                const listPriceText = cells[2].textContent.trim().replace('$', '').replace(/\s/g, '');
                const listPrice = parseFloat(listPriceText);

                // Only add valid entries to the result
                if (model && description && !isNaN(listPrice)) {
                    result[model] = { description, listPrice };
                }
            }
        });

        return result;
    }

    function initializeApp() {
        const modelTemplate = document.querySelector('.model');
        const itemsContainer = document.getElementById('itemsContainer');
        const addItemBtn = document.getElementById('addItem');
        const generateQuoteBtn = document.getElementById('generateQuote');
        const quoteOutput = document.getElementById('quoteOutput');
        const exportPDFBtn = document.getElementById('exportPDF');

        populateModels(modelTemplate);

        function populateModels(selectElement) {
            Object.keys(products).forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                selectElement.appendChild(option.cloneNode(true));
            });
        }

        addItemBtn.addEventListener('click', () => {
            const newItem = itemsContainer.querySelector('.item').cloneNode(true);
            newItem.querySelector('.removeItem').style.display = 'block';
            newItem.querySelector('.model').value = '';
            newItem.querySelector('.quantity').value = '1';
            newItem.querySelector('.description').value = '';
            newItem.querySelector('.listPrice').value = '';
            newItem.querySelector('.discount').value = '10';
            newItem.querySelector('.quotedPrice').value = '';
            populateModels(newItem.querySelector('.model'));
            attachItemEventListeners(newItem);
            itemsContainer.appendChild(newItem);
        });

        function attachItemEventListeners(item) {
            const modelSelect = item.querySelector('.model');
            const quantityInput = item.querySelector('.quantity');
            const descriptionTextarea = item.querySelector('.description');
            const listPriceInput = item.querySelector('.listPrice');
            const discountInput = item.querySelector('.discount');
            const quotedPriceInput = item.querySelector('.quotedPrice');
            const removeBtn = item.querySelector('.removeItem');

            modelSelect.addEventListener('change', () => {
                const selectedModel = modelSelect.value;
                if (selectedModel && products[selectedModel]) {
                    descriptionTextarea.value = products[selectedModel].description;
                    listPriceInput.value = products[selectedModel].listPrice.toFixed(2);
                    calculateQuotedPrice(listPriceInput, quantityInput, discountInput, quotedPriceInput);
                } else {
                    descriptionTextarea.value = '';
                    listPriceInput.value = '';
                    quotedPriceInput.value = '';
                }
            });

            quantityInput.addEventListener('input', () => {
                calculateQuotedPrice(listPriceInput, quantityInput, discountInput, quotedPriceInput);
            });

            discountInput.addEventListener('input', () => {
                calculateQuotedPrice(listPriceInput, quantityInput, discountInput, quotedPriceInput);
            });

            removeBtn.addEventListener('click', () => {
                if (itemsContainer.children.length > 1) {
                    item.remove();
                }
            });
        }

        function calculateQuotedPrice(listPriceInput, quantityInput, discountInput, quotedPriceInput) {
            const listPrice = parseFloat(listPriceInput.value) || 0;
            const quantity = parseInt(quantityInput.value) || 1;
            const discount = parseFloat(discountInput.value) || 0;
            const totalListPrice = listPrice * quantity;
            const quotedPrice = totalListPrice * (1 - discount / 100);
            quotedPriceInput.value = quotedPrice.toFixed(2);
        }

        attachItemEventListeners(itemsContainer.querySelector('.item'));

        generateQuoteBtn.addEventListener('click', () => {
            const customerName = document.getElementById('customerName').value;
            const customerPhone = document.getElementById('customerPhone').value;
            const customerEmail = document.getElementById('customerEmail').value;
            const items = itemsContainer.querySelectorAll('.item');

            if (!customerName) {
                alert('Please enter a customer name.');
                return;
            }

            // Get the current date
            const today = new Date();
            const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`; // MM/DD/YYYY format

            // Calculate the maximum description length to adjust column width
            let maxDescriptionLength = 0;
            items.forEach(item => {
                const description = item.querySelector('.description').value;
                if (description.length > maxDescriptionLength) {
                    maxDescriptionLength = description.length;
                }
            });
            // Estimate width based on character count (approximate 5px per character)
            const descriptionColumnWidth = Math.max(200, maxDescriptionLength * 5); // Minimum 200px

            let hasValidItem = false;
            let totalQuotedPrice = 0;
            let quoteTable = `
                <img src="supportek-logo.png" alt="Supportek Logo" class="logo">
                <div class="quote-header">
                    <h2>Quote for ${customerName}</h2>
                    <div class="date">Date: ${formattedDate}</div>
                </div>
                <div class="customer-info">
                    <p><strong>Customer Name:</strong> ${customerName}</p>
                    ${customerPhone ? `<p><strong>Phone:</strong> ${customerPhone}</p>` : ''}
                    ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
                </div>
                <table>
                    <tr>
                        <th>Model</th>
                        <th>Quantity</th>
                        <th class="description-column" style="width: ${descriptionColumnWidth}px;">Description</th>
                        <th>List Price</th>
                        <th>$ Discount</th>
                        <th>Quoted Price</th>
                    </tr>
            `;

            items.forEach(item => {
                const model = item.querySelector('.model').value;
                const quantity = item.querySelector('.quantity').value;
                const description = item.querySelector('.description').value;
                const listPrice = item.querySelector('.listPrice').value;
                const discount = item.querySelector('.discount').value;
                const quotedPrice = item.querySelector('.quotedPrice').value;

                if (model && listPrice && quotedPrice) {
                    hasValidItem = true;
                    const totalListPrice = parseFloat(listPrice) * parseInt(quantity);
                    const dollarDiscount = totalListPrice - parseFloat(quotedPrice);
                    totalQuotedPrice += parseFloat(quotedPrice);
                    quoteTable += `
                        <tr>
                            <td>${model}</td>
                            <td>${quantity}</td>
                            <td class="description-column" style="width: ${descriptionColumnWidth}px;">${description}</td>
                            <td>$${parseFloat(listPrice).toFixed(2)}</td>
                            <td>$${dollarDiscount.toFixed(2)}</td>
                            <td>$${parseFloat(quotedPrice).toFixed(2)}</td>
                        </tr>
                    `;
                }
            });

            if (!hasValidItem) {
                alert('Please add at least one valid item with a selected model.');
                return;
            }

            quoteTable += `
                    <tr>
                        <td colspan="5" style="text-align: right;"><strong>Total Quoted Price:</strong></td>
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

            // Attach the event listener for the export button
            const newExportPDFBtn = document.getElementById('exportPDF');
            newExportPDFBtn.addEventListener('click', () => {
                exportToPDF(customerName, customerPhone, customerEmail, formattedDate, items, totalQuotedPrice);
            });
        });

        function exportToPDF(customerName, customerPhone, customerEmail, formattedDate, items, totalQuotedPrice) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add the Supportek logo
            doc.addImage(supportekLogoBase64, 'PNG', 10, 10, 50, 20); // Adjust x, y, width, height as needed

            // Add header
            doc.setFontSize(16);
            doc.text(`Quote for ${customerName}`, 10, 40);
            doc.setFontSize(12);
            doc.text(`Date: ${formattedDate}`, 160, 40);

            // Add customer info
            let yPos = 50;
            doc.setFontSize(12);
            doc.text(`Customer Name: ${customerName}`, 10, yPos);
            if (customerPhone) {
                yPos += 10;
                doc.text(`Phone: ${customerPhone}`, 10, yPos);
            }
            if (customerEmail) {
                yPos += 10;
                doc.text(`Email: ${customerEmail}`, 10, yPos);
            }

            // Prepare table data
            yPos += 20;
            const tableData = [];
            items.forEach(item => {
                const model = item.querySelector('.model').value;
                const quantity = item.querySelector('.quantity').value;
                const description = item.querySelector('.description').value;
                const listPrice = item.querySelector('.listPrice').value;
                const quotedPrice = item.querySelector('.quotedPrice').value;

                if (model && listPrice && quotedPrice) {
                    const totalListPrice = parseFloat(listPrice) * parseInt(quantity);
                    const dollarDiscount = totalListPrice - parseFloat(quotedPrice);
                    tableData.push([
                        model,
                        quantity,
                        description,
                        `$${parseFloat(listPrice).toFixed(2)}`,
                        `$${dollarDiscount.toFixed(2)}`,
                        `$${parseFloat(quotedPrice).toFixed(2)}`
                    ]);
                }
            });

            // Add table using autoTable
            doc.autoTable({
                startY: yPos,
                head: [['Model', 'Quantity', 'Description', 'List Price', '$ Discount', 'Quoted Price']],
                body: tableData,
                styles: { fontSize: 10 },
                columnStyles: {
                    2: { cellWidth: 60 } // Description column wider
                }
            });

            // Add total
            yPos = doc.lastAutoTable.finalY + 10;
            doc.text(`Total Quoted Price: $${totalQuotedPrice.toFixed(2)}`, 150, yPos);

            // Add contact info
            yPos += 10;
            doc.setFontSize(10);
            doc.text('Contact: Jordan Ebner, Branch Manager', 10, yPos);
            yPos += 5;
            doc.text('Phone: 720-289-4986', 10, yPos);
            yPos += 5;
            doc.text('Address: 230 Yuma Street, Denver, CO 80204', 10, yPos);

            // Save the PDF
            doc.save(`Quote_${customerName}_${formattedDate.replace(/\//g, '-')}.pdf`);
        }
    }
});
