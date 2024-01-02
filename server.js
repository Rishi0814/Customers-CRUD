const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = 8000;

app.use(bodyParser.json());


const customers = JSON.parse(fs.readFileSync('customers.json', 'utf-8'));


app.get('/customers', (req, res) => {
    const { page = 1, per_page = 10, search_term = '' } = req.query;

    const filteredCustomers = customers.filter(customer =>
        [customer.first_name, customer.last_name, customer.city].some(field =>
            field.toLowerCase().includes(search_term.toLowerCase())
        )
    );

    const startIdx = (page - 1) * per_page;
    const endIdx = startIdx + per_page;
    const paginatedCustomers = filteredCustomers.slice(startIdx, endIdx);

    res.json(paginatedCustomers);
});


app.get('/customers/:id', (req, res) => {
    const customerId = parseInt(req.params.id);
    const customer = customers.find(c => c.id === customerId);

    if (customer) {
        res.json(customer);
    } else {
        res.status(404).json({ message: 'Customer not found' });
    }
});


app.get('/cities', (req, res) => {
    const cityCounts = customers.reduce((acc, customer) => {
        acc[customer.city] = (acc[customer.city] || 0) + 1;
        return acc;
    }, {});

    res.json(cityCounts);
});


app.post('/customers', (req, res) => {
    const newCustomer = req.body;


    if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.city || !newCustomer.company) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!customers.some(c => c.city === newCustomer.city && c.company === newCustomer.company)) {
        return res.status(400).json({ message: 'City or company does not exist for an existing customer' });
    }

    customers.push(newCustomer);
    fs.writeFileSync('customers.json', JSON.stringify(customers, null, 2), 'utf-8');

    res.status(201).json({ message: 'Customer added successfully' });
});

app.listen(port, () => {
    console.log(`Server is running on ${port}`);
});
