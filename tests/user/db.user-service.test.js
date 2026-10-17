require('dotenv').config();
const database = require('../../services/database');
const User = require('../../models/user.model');
const { ObjectId } = require('mongoose').Types;
const { 
    getUserById,
    getUserByEmail,
    getUserByUsername,
    getUserByWalletAddress,
    getUsersByIP,
    getUserByMintId,
    addUser,
    addMintsToUser,
    getAllUsers,
    getUserPaintings,
    verifyEmail,
    getRecentUsers,
    updateUser
} = require('../../services/database/user');

describe('Users Services Test Cases', () => {
    beforeEach(() => {
    });
    
    beforeAll(() => {
       database.connect();
    });
    
    describe('Get a user with user ID', () => {
        it('user ID is exist', async () => {
            const userId = '619f7e0c50ced718079ec5be';
            const user = await getUserById(userId, {});
          
            expect(String(user._id)).toBe(userId)
        });
    
        it('user ID is not exist', async () => {
            const fake_id = '619ce25ff66e3e1668750c7e';
            const user = await getUserById(fake_id, {});
            
            expect(user).toBe(null)
        });
    })

    describe('Get a user with user email', () => {
        it('user email is exist', async () => {
            const email = 'talha.kayani@gmail.com';
            const user = await getUserByEmail(email);
          
            expect(user.email).toBe(email)
        });
    
        it('user email is not exist', async () => {
            const fake_email = 'gukuqej12345@getnada.com';
            const user = await getUserByEmail(fake_email);
           
            expect(user).toBe(null)
        });
    })
    
    describe('Get a user with user name', () => {
        it('username is exist', async () => {
            const username = 'talha.kayani';
            const user = await getUserByUsername(username);
          
            expect(user.username).toBe(username)
        });
    
        it('username is not exist', async () => {
            const fake_name = 'fake_username';
            const user = await getUserByUsername(fake_name);
            
            expect(user).toBe(null)
        });
    })

    describe('Get a user with metamask wallet address', () => {
        it('metamask address is exist', async () => {
            const metamask_address = '0xaad7d223e95ace70f58ccf7bf387ddd651c33403';
            const user = await getUserByWalletAddress(metamask_address);
           
            expect(user.walletAddress).toBe(metamask_address)
        });
    
        it('metamask address is not exist', async () => {
            const fake_address = '0xaad7d223e95ace70f58ccf7bf387ddd651b33504';
            const user = await getUserByWalletAddress(fake_address);
           
            expect(user).toBe(null)
        });
    })

    describe('Get a user with arkane wallet address', () => {
        it('arkane address is exist', async () => {
            const arkane_address = '0x110606EC4C1C63dB38008eCE78C3C69D09688D81';
            const user = await getUserByWalletAddress(arkane_address);
            
            expect(user.walletAddress).toBe(arkane_address)
        });
    
        it('arkane address is not exist', async () => {
            const fake_address = '0xaad7d223e95ace70f58ccf7bf387ddd651b33504';
            const user = await getUserByWalletAddress(fake_address);
            
            expect(user).toBe(null)
        });
    })

    describe('Get a user with IP address', () => {
        it('IP address is exist', async () => {
            const IP_address = '127.0.0.1';
            const user = await getUsersByIP(IP_address);
           
            const ip = String(user[0].ipAddress);
            expect(ip).toBe(IP_address)
        });
    
        it('IP address is not exist', async () => {
            const fake_address = '25.04.54.983';
            const user = await getUsersByIP(fake_address);
           
            expect(user).toEqual([])
        });
    })

    describe('Get a user by mint ID', () => {
        it('Mint Id is exist', async () => {
            const mint_id = '616d3948efa0043d2b8663d3';
            const user = await getUserByMintId(mint_id);
           
            const mintId = String(user.mints[0]);
            expect(mintId).toBe(mint_id)
        });
    
        it('Mint Id is not exist', async () => {
            const fake_id = '6153dd107b006b2014c4b888';
            const user = await getUserByMintId(fake_id);
          
            expect(user).toBe(null)
        });
    })

    describe('Add User into db', () => {
        it('It should create a user', async () => {
            const userObj = {
                username: "new test user",
                email: "test.user@yahoo.com"
            }
            const user = await addUser(userObj);
            
            expect(user.email).toBe(userObj.email)
        });

        it('It should add mints to created user', async () => {
            const user = await User.find().sort( { "_id": -1 } );
            const userId = user[0]._id;
            const mints = [
                "6172303a3267c3001321d13b",
                "6172303a3267c3001321d13d"
            ];
            const result = await addMintsToUser(userId, mints);
       
            expect(result).toBe(result)
        });

        it('Delete created user', async () => {
            const user = await User.find().sort( { "_id": -1 } );
            const userId = user[0]._id;
          
            await User.deleteOne( {"_id": ObjectId(userId)});
            expect(userId).toBe(userId)
        })
    })

    describe('Update User into db', () => {
        it('It should update a user', async () => {
            const userId = "619f7e0c50ced718079ec5be";
            const userObj = {
                username: "talha.kayani",
                }
            const user = await updateUser(userId, userObj);
           
            expect(user.username).toBe(userObj.username)
        });
    })

    describe('Get all users', () => {
        it('It should get all users', async () => {
            const users = await getAllUsers();
            expect(users).toBe(users)
        });
    })

    describe('Get user paintings by user id', () => {
        it('It should get all user paintings', async () => {
            const userId = "619dd8d3227b3999e04d9d29";
            const paintings = await getUserPaintings(userId);
            expect(paintings).toBe(paintings)
        });
    })

    describe('Verify Email', () => {
        it('It should verify the email', async () => {
            const userId = "619dd8d3227b3999e04d9d29";
            const result = await verifyEmail(userId);
            
            expect(result.ok).toBe(1)
        });
    })

    describe('Get recent users', () => {
        it('It should get recenet users', async () => {
            const users = await getRecentUsers();
            expect(users).toBe(users)
        });
    })

    afterEach(()=> {
    });
    
    afterAll(() => {
    });
    
});


