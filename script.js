document.addEventListener('DOMContentLoaded', () => {
    const products = {
        '90000465': { description: 'Xtreme Power J60 Series 350VA/200W Standby UPS...', listPrice: 439 },
        '90000776': { description: 'Xtreme Power J60 Series 600VA/360W Standby UPS...', listPrice: 749 },
        '90000853': { description: 'Xtreme Power V80 Series 700VA/420W; Line-Interactive UPS...', listPrice: 499 },
        '90000373': { description: 'Replacement battery pack for P90-3000...', listPrice: 429 }
    };

    const partNumberTemplate = document.querySelector('.partNumber');
    const itemsContainer = document.getElementById('itemsContainer');
    const addItemBtn = document.getElementById('addItem');
    const generateQuoteBtn = document.getElementById('generateQuote');
    const quoteOutput = document.getElementById('quoteOutput');

    populatePartNumbers(partNumberTemplate);

    function populatePartNumbers(selectElement) {
        Object.keys(products).forEach(partNumber => {
            const option = document.createElement('option');
            option.value = partNumber;
            option.textContent = partNumber;
            selectElement.appendChild(option.cloneNode(true));
        });
    }

    addItemBtn.addEventListener('click', () => {
        const newItem = itemsContainer.querySelector('.item').cloneNode(true);
        newItem.querySelector('.removeItem').style.display = 'block';
        newItem.querySelector('.partNumber').value = '';
        newItem.querySelector('.description').value = '';
        newItem.querySelector('.listPrice').value = '';
        newItem.querySelector('.discount').value = '10';
        newItem.querySelector('.quotedPrice').value = '';
        populatePartNumbers(newItem.querySelector('.partNumber'));
        attachItemEventListeners(newItem);
        itemsContainer.appendChild(newItem);
    });

    function attachItemEventListeners(item) {
        const partNumberSelect = item.querySelector('.partNumber');
        const descriptionTextarea = item.querySelector('.description');
        const listPriceInput = item.querySelector('.listPrice');
        const discountInput = item.querySelector('.discount');
        const quotedPriceInput = item.querySelector('.quotedPrice');
        const removeBtn = item.querySelector('.removeItem');

        partNumberSelect.addEventListener('change', () => {
            const selectedPart = partNumberSelect.value;
            if (selectedPart && products[selectedPart]) {
                descriptionTextarea.value = products[selectedPart].description;
                listPriceInput.value = products[selectedPart].listPrice.toFixed(2);
                calculateQuotedPrice(listPriceInput, discountInput, quotedPriceInput);
            } else {
                descriptionTextarea.value = '';
                listPriceInput.value = '';
                quotedPriceInput.value = '';
            }
        });

        discountInput.addEventListener('input', () => {
            calculateQuotedPrice(listPriceInput, discountInput, quotedPriceInput);
        });

        removeBtn.addEventListener('click', () => {
            if (itemsContainer.children.length > 1) {
                item.remove();
            }
        });
    }

    function calculateQuotedPrice(listPriceInput, discountInput, quotedPriceInput) {
        const listPrice = parseFloat(listPriceInput.value) || 0;
        const discount = parseFloat(discountInput.value) || 0;
        const quotedPrice = listPrice * (1 - discount / 100);
        quotedPriceInput.value = quotedPrice.toFixed(2);
    }

    attachItemEventListeners(itemsContainer.querySelector('.item'));

    generateQuoteBtn.addEventListener('click', () => {
        const customerName = document.getElementById('customerName').value;
        const items = itemsContainer.querySelectorAll('.item');

        if (!customerName) {
            alert('Please enter a customer name.');
            return;
        }

        let hasValidItem = false;
        let totalQuotedPrice = 0;
        let quoteTable = `
            <img src="supportek-logo.png" alt="Supportek Logo" class="logo">
            <h2>Quote for ${customerName}</h2>
            <table>
                <tr>
                    <th>Part Number</th>
                    <th>Description</th>
                    <th>List Price</th>
                    <th>Discount</th>
                    <th>Quoted Price</th>
                </tr>
        `;

        items.forEach(item => {
            const partNumber = item.querySelector('.partNumber').value;
            const description = item.querySelector('.description').value;
            const listPrice = item.querySelector('.listPrice').value;
            const discount = item.querySelector('.discount').value;
            const quotedPrice = item.querySelector('.quotedPrice').value;

            if (partNumber && listPrice && quotedPrice) {
                hasValidItem = true;
                totalQuotedPrice += parseFloat(quotedPrice);
                quoteTable += `
                    <tr>
                        <td>${partNumber}</td>
                        <td>${description}</td>
                        <td>$${parseFloat(listPrice).toFixed(2)}</td>
                        <td>${discount}%</td>
                        <td>$${parseFloat(quotedPrice).toFixed(2)}</td>
                    </tr>
                `;
            }
        });

        if (!hasValidItem) {
            alert('Please add at least one valid item with a selected part number.');
            return;
        }

        quoteTable += `
                <tr>
                    <td colspan="4" style="text-align: right;"><strong>Total Quoted Price:</strong></td>
                    <td><strong>$${totalQuotedPrice.toFixed(2)}</strong></td>
                </tr>
            </table>
        `;

        quoteOutput.innerHTML = quoteTable;
        quoteOutput.style.display = 'block';
    });
});
