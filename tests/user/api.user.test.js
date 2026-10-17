const request = require('supertest');
const { HTTP_STATUS_CODE } = require('../../configs/constants');
const { app } = require('../../server');
const { web3Instance } = require('../../utils/helpers');
const ethUtil = require('ethereumjs-util');
const walletAddressVenly = process.env.TEST_WALLET_ADDRESS_VENLY;
const walletAddressMetamask = process.env.TEST_WALLET_ADDRESS_METAMASK;
const recaptcha_key = process.env.RECAPTCHA_SECRET;

describe('User APIs Test Cases', () => {

  beforeEach(() => {
  });

  beforeAll(() => {
  });

  describe(`/POST login`, () => {
      it.skip('it should return status code 201 - Created', async () => {
          const response = await request(app)
            .post(`/user/login`)
            .send({
              walletAddress: "0xaad7d223e95ace70f58ccf7bf387ddd651c33403",
              walletType: "metamask",
              signature: "0x86d1bc3895863d832d1e9a6a14889da10d132ffb5be64282a1d720b8c9d18a867a8592e8d32bd723b28baa973c65ecf0ad0ad5a04a03e2856a4f898ccddda8421c"
            });
            
          // it would be un authorized due to required signature 
          expect(response.statusCode).toBe(HTTP_STATUS_CODE.CREATED);
      });
      it('Missing parameters - should return code 400', async () => {
            const response = await request(app)
              .post(`/user/login`)
              .send({
                walletAddress: '',
              });
            expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
      });
      it('wrong wallet address - it should return code 400', async () => {
          const response = await request(app)
            .post(`/user/login`)
            .send({
              walletAddress: '0x7D65D64210810D17b5F1717e20ajkjkjfjhjh36ba',
            });
          expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
      });
  });

  describe(`/POST register`, () => {
    it('User Not Authorized, False Recaptcha - it should return status code 401 - UnAuthorized', async () => {
          const response = await request(app)
            .post(`/user/register`)
            .send({
              username: "test555 name",
              email: "test555@gmail.com",
              walletAddress: "0x4bE01c5a1fD055eAaF76C5eE257FEbc529D9b5Ed",
              walletType: "metamask",
            })
       
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
        expect(response.body.message).toBe('False recaptcha');
    })
    it.skip('it should return status code 400 - Validation Bad Request', async () => {
        const response = await request(app)
          .post(`/user/register`)
          .send({
            username: "talha.kayani",
            email: "talha.kayani123@invozone.com",
            walletAddress: "0xaad7d223e95ace70f58ccf7bf387ddd651c33402",
            walletType: "metamask",
            humanKey: recaptcha_key
          })
         
      expect(response.body).toBe("This Username is already in use");
    })
    it.skip('it should return status code 400 - Bad Request', async () => {
        const response = await request(app)
          .post(`/user/register`)
          .send({
          username: "test12345 name",
          email: "test546756@gmail.com",
          walletAddress: "0xaad7d223e95ace70f58ccf7bf387ddd651c33403",
          walletType: "metamask",
          humanKey: recaptcha_key
        });
      
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
      // expect(response.body).toBe("User already exists with this Meta Mask Address");
    }) 
    it.skip('it should return status code 400 - Bad Request', async () => {
        const response = await request(app)
          .post(`/user/register`)
          .send({
          username: "test45 name",
          email: "test34345@gmail.com",
          walletAddress: "sdlmsldkcmsldkcmsldkmc",
          walletType: "metamask",
          humanKey: recaptcha_key
        })
     
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
      // expect(response.body).toBe("Please either provide a valid Meta Mask Address or a valid Arkane Wallet Address");
    })
    // this run only when all upper cases pass and give not existing and valit format metamask address.
    it.skip('it should return status code 201 - Created', async () => {
        const response = await request(app)
          .post(`/user/register`)
          .send({
            username: "new user check",
            email: "check@gmail.com",
            walletAddress: "0x4bE01c5a1fD055eAaF76C5eE257FEbc529D9b5Ed",
            walletType: "metamask",
            humanKey: recaptcha_key
        })
        
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.CREATED)
    })
  });

  describe(`/GET paintings`, () => {
    it('it should return status code 401- UnAuthorized', async () => {
        const response = await request(app)
        .get(`/user/paintings`)
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
        expect(response.body).toBe("No token available, authorization denied!")
    })
    
    it('it should return status code 200- OK', async () => {
        const response = await request(app)
          .get(`/user/paintings?page=1&numberOfRows=4`)
          .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
         
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
      // expect(response.body).toBe("Please either provide a valid Meta Mask Address or a valid Arkane Wallet Address");
    })
  });

  describe(`/GET details`, () => {
    it('it should return status code 401- UnAuthorized', async () => {
        const response = await request(app)
          .get(`/user/details`)
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
        expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should return status code 200- OK', async () => {
        const response = await request(app)
          .get(`/user/details`)
          .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
          
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
        expect(response.body.success).toBe(true);
    })
  });
    
  describe(`/POST sale`, () => {
    it('it should return status code 401- UnAuthorized', async () => {
        const response = await request(app)
        .post(`/user/sale`)
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
        expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should return status code 400- Required Body Parameters', async () => {
            const response = await request(app)
            .post(`/user/sale`)
            .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
            
            expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
    })
    it('it should return status code 400- Bad Request', async () => {
            const response = await request(app)
            .post(`/user/sale`)
            .send({
                mintId: "6151675b8cbb1e1abdc4c848",
                address: ""
            })
            .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
            
            expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
            expect(response.body).toBe("Required parameters are missing");
    })
    it('it should return status code 400- Bad Request', async () => {
          const response = await request(app)
          .post(`/user/sale`)
          .send({
              mintId: "6172303a3267c3001321d13b",
              address: "0xaad7d223e95ace70f58ccf7bf387ddd651c33403"
          })
          .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
         
          expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
          expect(response.body).toBe("Mint already on sale");
    })
    it('it should return status code 400- Bad Request', async () => {
          const response = await request(app)
          .post(`/user/sale`)
          .send({
              mintId: "6172303a3267c3001321d13c",
              address: "0xaad7d223e95ace70f58ccf7bf387ddd651c33403"
          })
          .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
         
          expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
          expect(response.body).toBe("Invalid mint provided");
    })
      // For passed this test case, go to given mintId document from the mints collection in db and
        // update active field to false, which is placed in sale object.
    it.skip('it should return status code 200- OK', async () => {
        const response = await request(app)
        .post(`/user/sale`)
        .send({
            mintId: "616d3948efa0043d2b8663d3",
            address: "0xaad7d223e95ace70f58ccf7bf387ddd651c33403"
        })
        .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
       
        expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
        expect(response.body.message).toBe("Mint put on sale success");
    })
  })

  describe(`/POST verifyEmail`, () => {
    it('it should return status code 400 - Bad Request', async () => {
            const response = await request(app)
            .post(`/user/verifyEmail`)
            .send({
                email: "",
                code: ""
            })
           
            expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
            expect(response.body).toBe("Required parameters are missing");
    })
    it('it should return status code 409- Conflict', async () => {
            const response = await request(app)
            .post(`/user/verifyEmail`)
            .send({
                email: "talha.kayani@gmail.com",
                code: "234234"
            })
          
            expect(response.statusCode).toBe(HTTP_STATUS_CODE.CONFLICT);
            expect(response.body.message).toBe("This link is already used or invalid");
    })
    it('it should return status code 400- Bad Request', async () => {
          const response = await request(app)
          .post(`/user/verifyEmail`)
          .send({
              email: "abc12@gmail.com",
              code: "1245"
          })
         
          expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
          expect(response.body.message).toBe("User does not exist");
    })
  })

  describe('/POST validate2fa', () => {
    it('it should return status code 401- UnAuthorized', async () => {
              const response = await request(app)
              .post(`/user/validate2fa`)
              expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
              expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should return status code 400 - Bad Request', async () => {
              const response = await request(app)
              .post(`/user/validate2fa`)
              .send({
                  twoFACode: "dvxdxv",
                  login: ""
              })
              .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
             
              expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
              expect(response.body.message).toBe("Code is invalid or expired");
    })
  })

  describe('/PUT updateUser', () => {
    it('it should return status code 401- UnAuthorized', async () => {
      const response = await request(app)
      .put(`/user/updateUser`)
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
      expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should return status code 400 - Bad Request', async () => {
      const response = await request(app)
      .put(`/user/updateUser`)
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
      .send({
          username: "",
          email: "",
          firstName: "",
          lastName: "",
          country: "",
          state: "",
          streetAddressLine1: "",
          streetAddressLine2: "",
          suburb: "",
          zipCode: "",
          recoveryEmail: "",
          fullName: "",
      })
     
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST);
      expect(response.body.message).toBe("Required parameters are missing")
    })
    it('it should return status code 201 - Created', async () => {
      const response = await request(app)
      .put(`/user/updateUser`)
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
      .send({
          username: "talha.kayani",
          email: "talha.kayani@gmail.com",
      })
      
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.CREATED);
    })
  })

  describe('/POST active2fa', () => {
    it('it should return status code 401- UnAuthorized', async () => {
      const response = await request(app)
      .post(`/user/active2fa`)
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
      expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should return status code 200 - OK', async () => {
      const response = await request(app)
      .post(`/user/active2fa?id=618a778653fb076e55d47baa`)
      .send({
        active: false,
        service: "email"
      })
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
     
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
      expect(response.body.message).toBe("Email 2fa deactivated");
    })
    it('it should return status code 200 - OK', async () => {
      const response = await request(app)
      .post(`/user/active2fa?id=618a778653fb076e55d47baa`)
      .send({
        active: true,
        service: "email"
      })
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
      
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
      expect(response.body.message).toBe("Email 2fa activated");
    })
    it('it should return status code 200 - OK', async () => {
      const response = await request(app)
      .post(`/user/active2fa?id=618a778653fb076e55d47baa`)
      .send({
        active: true,
        service: "auth"
      })
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
   
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
      expect(response.body.message).toBe("Authenticator app 2fa activated");
    })
    it('it should return status code 200 - OK', async () => {
      const response = await request(app)
      .post(`/user/active2fa?id=618a778653fb076e55d47baa`)
      .send({
        active: false,
        service: "auth"
      })
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
    
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK);
      expect(response.body.message).toBe("Authenticator app 2fa deactivated");
    })
  })

  describe(`GET verificationEmail`, () => {
    it('it should return status code 401- UnAuthorized', async () => {
      const response = await request(app)
      .get(`/user/verificationEmail`)
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
    })
    it('it should be return status code 500 - INternal Server Error', async () => {
      const response = await request(app)
      .get('/user/verificationEmail?id=618a778653fb076e55d47baa')
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
    
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.INTERNAL_SERVER)
      expect(response.body.message).toBe("Sending verification email failed")
    })
  })

  describe(`POST resend2FAEmail`, () => {
    it('it should be return status code 400 - Bad Request', async () => {
      const response = await request(app)
      .post(`/user/resend2FAEmail`)
      .send({
        username: ""
      })
   
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST)
      expect(response.body.message).toBe("Missing required parama")
    }) 
    it('it should be return status code 400 - Bad Request', async () => {
      const response = await request(app)
      .post(`/user/resend2FAEmail`)
      .send({
        username: "abc123"
      })
    
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST)
      expect(response.body.message).toBe("User does not exist")
    })
  })

  describe(`GET checkUserVerified`, () => {
    it('it should return status code 401- UnAuthorized', async () => {
      const response = await request(app)
      .get(`/user/checkUserVerified`)
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED);
      expect(response.body).toBe("No token available, authorization denied!")
    })
    it('it should be return status code 200 - OK', async () => {
      const response = await request(app)
      .get(`/user/checkUserVerified`)
      .set('x-auth-token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYxOWY3ZTBjNTBjZWQ3MTgwNzllYzViZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjM3OTA2MTYyfQ.Cb8ftYK_ljvHANkBtWWDV6w06aXpUDdczaFqNmutrxg')
      
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK)
    })
  })

  describe('/GET userMints', () => {
    it('it should be return status code 200 - OK', async () => {
      const response = await request(app)
      .get(`/user/userMints`)
      expect(response.statusCode).toBe(HTTP_STATUS_CODE.OK)
      expect(response.body.message).toBe("User with mints are fetched")
    })
  })

  afterEach(()=> {
  });

  afterAll(() => {
  });

})