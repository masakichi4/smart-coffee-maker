<template>
  <v-app id="login">
    <v-content>
      <v-container fluid fill-height>
        <v-layout align-center justify-center>

          <v-flex xs12 sm8 md4>
            <v-card class="elevation-12">
              <v-toolbar dark color='#a35638'>
                <v-toolbar-title>Smart Coffee Maker</v-toolbar-title>
                <v-spacer></v-spacer>
              </v-toolbar>
              <v-card-text>
                <v-form id="form"
                v-model=valid
                lazy-validation>
                  <v-text-field
                  color='#a35638'
                  prepend-icon="mail"
                  label="Email"
                  name="email"
                  type="text"
                  v-model=email
                  :rules="email_rules"></v-text-field>
                  <v-text-field
                  color='#a35638'
                  id="password"
                  prepend-icon="lock"
                  name="password"
                  label="Password"
                  type="password"
                  v-model=password
                  :rules="password_rules"></v-text-field>
                  <v-radio-group
                  v-model="account_type"
                  row>
                    <v-radio
                    label="basic"
                    value="basic_account"
                    color='#e08f62'
                    ></v-radio>
                    <v-radio
                    label="premium"
                    value="premium_account"
                    color='#a35638'></v-radio>
                  </v-radio-group>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn :disabled="!valid||!account_type" color='#a35638' @click=register>Register</v-btn>
                <v-btn :disabled="!valid||account_type" color='#9dab86' @click=login>Log In</v-btn>
              </v-card-actions>
            </v-card>
          </v-flex>
        </v-layout>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
import router from '../router'
import axios from 'axios'
export default {
  name: 'Login',
  data: () => ({
    valid: false,
    email: '',
    password: '',
    account_type: null,
    password_rules: [
      v => !!v || 'Password is required'
    ],
    email_rules: [
      v => !!v || 'E-mail is required',
      v => /.+@.+\..+/.test(v) || 'Invalid email format'
    ]
  }),
  methods: {
    register () {
      let data = {
        email: this.email,
        password: this.password,
        account_type: this.account_type
      }
      axios
        .post('http://localhost:8999/register', data)
        .then((response) => {
          console.log('registered')
          console.log(response)
          router.push({ name: 'Main', params: data })
        })
        .catch((error) => {
          console.log('Cannot register')
          console.log(error)
        })
    },
    login () {
      axios
        .post('http://localhost:8999/login', { email: this.email, password: this.password })
        .then((response) => {
          console.log('Logged in')
          router.push({ name: 'Main', params: { email: response.data.email, account_type: response.data.account_type } })
        })
        .catch((error) => {
          console.log('Cannot log in')
          console.log(error)
        })
    }
  },
  props: {
    source: String
  }
}
</script>
