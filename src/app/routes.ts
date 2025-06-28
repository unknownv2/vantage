import { activationStrategy } from 'aurelia-router';

export default [
    { route: '', name: 'default', moduleId: 'welcome/welcome' },
    { route: 'editor/:id', name: 'editor', moduleId: 'editor/editor', activationStrategy: activationStrategy.replace, },
];