function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username: username,
        password: password
    };
    
    console.log(data);

    fetch('https://frrsi09ifc.execute-api.ap-southeast-1.amazonaws.com/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            alert('Login successful! Token: ' + data.token);
            window.location.href = '/driver_index_cme.html';

        } else {
            alert('Login failed.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
