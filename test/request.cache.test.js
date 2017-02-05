'use strict';

require('./index.js');
const requestCache = require('../lib/request.cache.js')();

describe('Request Cache', () => {

    it('Can resolve a callback', () => {
        return new Promise((resolve) => {
            requestCache.addCallback('callback test', resolve);
            requestCache.resolve('callback test', 'resolved');
        }).should.become('resolved');
    });

    it('Can reject a callback', () => {
        return new Promise((resolve, reject) => {
            requestCache.addCallback('callback test', (val, err) => {
                reject(err);
            });
            requestCache.reject('callback test', 'rejected');
        }).should.be.rejectedWith('rejected');
    });

    it('Can resolve a promise', () => {
        const promise = new Promise(requestCache.addPromise.bind(null, 'promise test'));
        requestCache.resolve('promise test', 'resolved');
        return promise.should.become('resolved');
    });


    it('Can reject a promise', () => {
        const promise = new Promise(requestCache.addPromise.bind(null, 'promise test'));
        requestCache.reject('promise test', 'rejected');
        return promise.should.be.rejectedWith('rejected');
    });

    it('Can reject all entries', () => {
        const promiseOne = new Promise(requestCache.addPromise.bind(null, 'promise 1'));
        const promiseTwo = new Promise(requestCache.addPromise.bind(null, 'promise 2'));
        const promiseThree = new Promise(requestCache.addPromise.bind(null, 'promise 3'));
        requestCache.rejectAll('all rejected');

        return Promise.all([
            promiseOne.should.be.rejectedWith('all rejected'),
            promiseTwo.should.be.rejectedWith('all rejected'),
            promiseThree.should.be.rejectedWith('all rejected')
        ]);
    });
});
