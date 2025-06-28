define('crypto', function() { 
    // Aurelia enumerates the properties of all dependencies, 
    // which winds up triggering a deprecation warning in node.
    // Since we don't need these APIs, we can just delete em.
    var crypto = window.nodeRequire('crypto'); 
    delete crypto.createCredentials;
    delete crypto.Credentials;
    return crypto;
});