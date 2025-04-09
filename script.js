document.addEventListener('DOMContentLoaded', () => {
    const products = {
        '90000465': { description: 'Xtreme Power J60 Series 350VA/200W Standby UPS; 120VAC; C14 inlet with C13 to 5-15P (3ft) detachable power cord; (3) 5-15R output receptacles; Lithium battery for longer life and up to 104 F operation without battery degradation; Battery Management System (BMS) insures cell voltage balancing, parallel current sharing, and overcharge/discharge protection; surge protection; Wall or Desk Mounting; UL, cUL, RoHS and TAA compliant; 5-Year Full Warranty (USA and Canada), 3-Year Full Warranty (worldwide); 6.9"W x 8.5"D x 1.25"H, 3.4 lbs', listPrice: 439 },
        '90000776': { description: 'Xtreme Power J60 Series 600VA/360W Standby UPS; 120VAC; C14 inlet with C13 to 5-15P (3ft) detachable power cord; (3) 5-15R output receptacles; Lithium battery for longer life and up to 104 F operation without battery degradation; redundant Battery Management System (BMS) insures cell voltage balancing, parallel current sharing, and overcharge/discharge protection; surge protection; Wall or Desk Mounting; UL, cUL, RoHS and TAA compliant; 5-Year Full Warranty (USA and Canada), 3-Year Full Warranty (worldwide); 7.3"W x 10.8"D x 1.6"H, 4.7 lbs', listPrice: 749 },
        '90000853': { description: 'Xtreme Power V80 Series 700VA/420W; Line-Interactive UPS; 2U; 120VAC; pure sinewave output; 5\' detachable C13 to 5-15 input line cord; (8) 5-15R output receptacles; Hot Swappable batteries; 1-6A adjustable charger; Full Load Runtime = 2.3 min; ECO mode; Tower and rack mounting; Smart LCD screen; Intelligent slot; RS-232, USB port, and EPO connections; UL, cUL, RoHS approved; 3 year full Warranty (USA and Canada); 25K load protection policy; 17.2" x 16.1" x 3.5"; 24 lbs', listPrice: 499 },
        '90000373': { description: 'Replacement battery pack for P90-3000, P90G-3000, P80-2200, P80-3000, P80G-3000 UPS or P90-BP72. (1) Required per UPS, (2) required per B90-BP72. One Year Warranty. 8.5"W x 18.5"L x 2.6"H. 37 lbs.', listPrice: 429 }
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
        const customerPhone = document.getElementById('customerPhone').value;
        const items = itemsContainer.querySelectorAll('.item');

        if (!customerName) {
            alert('Please enter a customer name.');
            return;
        }

        // Get the current date
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`; // MM/DD/YYYY format

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
            </div>
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
            <div class="contact-info">
                <p><strong>Contact:</strong> Jordan Ebner, Branch Manager</p>
                <p><strong>Phone:</strong> 720-289-4986</p>
                <p><strong>Address:</strong> 230 Yuma Street, Denver, CO 80204</p>
            </div>
        `;

        quoteOutput.innerHTML = quoteTable;
        quoteOutput.style.display = 'block';
    });
});
