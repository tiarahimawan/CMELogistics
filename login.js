function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const data = {
        username: username,
        password: password
    };

    fetch('https://YOUR_BACKEND_ENDPOINT/login', {
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
        } else {
            alert('Login failed.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
