const express = require('express');

module.exports = [
  express.urlencoded({
    limit: '16mb',
    extended: false,
  }),
  express.json({
    limit: '16mb',
    type: ['json', 'application/csp-report'],
  }),
];
