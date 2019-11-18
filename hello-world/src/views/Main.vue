<template>
  <v-app id='main'>
    <v-content>
      <v-container>
        <v-card
        color='#a35638'
        dark
        >
          <v-card-title class="text-center justify-center py-6">
            <h1 class="font-weight-bold display-3">
            Smart Coffee Maker</h1>
          </v-card-title>
          <v-card-subtitle
          class="text-center justify-center font-weight-bold"
          v-if="account_type=='premium_account'">
            Premium Account
          </v-card-subtitle>
          <v-card-subtitle
          class="text-center justify-center font-weight-bold"
          v-else>
            Basic Account
          </v-card-subtitle>
          <v-tabs
            background-color="transparent"
            fixed-tabs
            slider-color="white"
          >
            <v-tab>
              <v-icon left>mdi-coffee</v-icon>
              Brew
            </v-tab>
            <v-tab>
              <v-icon left>credit_card</v-icon>
              Payment
            </v-tab>
            <v-tab>
              <v-icon left>gavel</v-icon>
              Admin
            </v-tab>

            <v-tab-item>
              <v-card flat>
                <v-card-title class="brown--text">
                  <h1 class="display-1">Start Brewing: </h1>
                </v-card-title>
                <v-card-text>
                  <v-form
                  v-model=valid_brew>
                  <v-select
                  color='#e08f62'
                  v-model="maker_select"
                  label="Choose a Coffee Maker"
                  :rules="[v => !!v || 'Item is required']"
                  :items="coffee_makers" />
                  <v-select
                  color='#e08f62'
                  v-model="flavor_select"
                  label="Choose a Flavor"
                  :rules="[v => !!v || 'Item is required']"
                  :items="coffee_flavors" />
                  <v-row >
                    <v-col
                    cols="6">
                      <v-checkbox
                      v-model="milk_check"
                      label="With Milk"
                      color='#a35638'/>
                   </v-col>
                  <v-col
                  cols="6">
                    <v-checkbox
                    v-model="sugar_check"
                    label="With Sugar"
                    color='#a35638'/>
                  </v-col>
                  </v-row>
                </v-form>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn :disabled="!valid_brew" dark color='#9dab86' @click=brew>Brew Now</v-btn>
                </v-card-actions>
              </v-card>

            </v-tab-item>
            <v-tab-item>
              <v-card flat>
                <v-card-title class="brown--text" v-if="account_type=='premium_account'">
                  <h1 class="display-1">Payment due this month: </h1>
                </v-card-title>
                <v-card-title v-else>
                  <h1 class="display-1 grey--text">Your account is free.</h1>
                </v-card-title>
                <v-card-text class="headline">
                  <p>{{email}}</p>
                  <p v-if="payment_due>0">${{payment_due}}</p>
                  <v-form
                  @submit=pay
                  v-model=valid_money
                  lazy-validation
                  v-if="payment_due>0"
                  >
                    <v-text-field
                    prepend-icon="money"
                    label="Input the amount of dollars to pay.."
                    filled
                    color='#a35638'
                    v-model=paid
                    />
                  </v-form>
                  <v-card-actions v-if="payment_due>0">
                    <v-spacer></v-spacer>
                    <v-btn color='#e08f62' dark @click=pay>Pay Now</v-btn>
                  </v-card-actions>
                </v-card-text>
              </v-card>

            </v-tab-item>
            <v-tab-item>
              <v-card flat >
                <v-card-title class="brown--text" v-if="account_type=='premium_account'">
                  Administration services for your premium account
                </v-card-title>
                <v-card-title class="grey--text" v-else>
                  Please upgrade your account to premium for more services!
                </v-card-title>
                <v-card-text v-if="account_type=='premium_account'">
                </v-card-text>
                <v-card-text v-else>
                  <v-btn
                  dark
                  color='#e08f62'
                  @click=upgrade>
                    Upgrade Now
                  </v-btn>
                </v-card-text>
                <v-card-text v-if="account_type=='premium_account'">
                  <h1 class="brown--text text-center justify-center"> Your brew history </h1>
                  <v-row
                  v-for="brew in brew_history"
                  :key="brew.date">
                  <v-col cols="4">{{brew.date}}</v-col>
                  <v-col cols="4">{{brew.maker_select}}, {{brew.flavor_select}}</v-col>
                  <v-col cols="2" v-if="brew.milk_check">With Milk</v-col>
                  <v-col cols="2" v-if="brew.sugar_check">With Sugar</v-col>
                  </v-row>
                  <v-alert
                  dismissible
                  color='#9dab86'
                  dark
                  v-if="requested">Request for Maintenance Submitted!</v-alert>
                  <v-btn
                  color='e08f62'
                  v-if="repair"
                  :disabled="requested"
                  @click=request_repair>Request for maintenance service</v-btn>
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                    icon
                    color='red'
                    to='/'>
                      <v-icon>logout</v-icon>
                    </v-btn>
                  </v-card-actions>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs>
<!--           <v-tabs-items v-model="tab">
            <v-tab-item
              v-for="item in items"
              :key="item.title"
            >
              <v-card flat>
                <v-card-text>{{ item.title }}</v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items> -->
        </v-card>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
// import router from '../router'
import axios from 'axios'
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Main',
  props: {
    email: String,
    account_type: String
  },
  data: () => ({
    repair: false,
    request_date: null,
    requested: false,
    brew_history: [],
    sugar_check: false,
    milk_check: false,
    flavor_select: null,
    maker_select: null,
    coffee_makers: ['Keurig K-Cafe', 'Ninja CE201', 'Delonghi ECAM23260SB Magnifica'],
    coffee_flavors: ['light roast', 'medium roast', 'dark roast'],
    valid_brew: false,
    payment_due: null,
    valid_money: false,
    paid: 0.0,
    tab: 'Home',
    mini: true,
    nav: 'Home',
    items: [
      { title: 'Home', icon: 'home', path: { name: 'Home' } },
      { title: 'Payment', icon: 'credit_card', path: '' },
      { title: 'Admin', icon: 'gavel', path: '' }
    ]
  }),
  methods: {
    pay () {
      let data = {
        email: this.email,
        payment_due: this.payment_due - this.paid
      }
      axios
        .post('http://localhost:8999/pay', data)
        .then((response) => {
          console.log(response)
          this.payment_due = data.payment_due
        })
        .catch((error) => {
          console.log(error)
        })
    },
    upgrade () {
      let data = {
        email: this.email,
        account_type: 'premium_account'
      }
      axios
        .post('http://localhost:8999/upgrade', data)
        .then((response) => {
          console.log('upgraded account')
          console.log(response)
          this.account_type = 'premium_account'
          this.payment_due = 30
        })
        .catch((error) => {
          console.log('upgrade failed')
          console.log(error)
        })
    },
    brew () {
      let data = {
        email: this.email,
        flavor_select: this.flavor_select,
        maker_select: this.maker_select,
        sugar_check: this.sugar_check,
        milk_check: this.milk_check,
        date: new Date()
      }
      axios
        .post('http://localhost:8999/brew_history', data)
        .then((response) => {
          console.log('brewed')
          console.log(response)
          this.$set(this.brew_history, response.data)
          this.brew_history = response.data
          if (this.brew_history.length > 3) {
            this.repair = true
          }
        })
        .catch((error) => {
          console.log('unable to brew')
          console.log(error)
        })
    },
    request_repair () {
      let data = {
        email: this.email,
        request_date: new Date()
      }
      axios
        .post('http://localhost:8999/request_repair', data)
        .then((response) => {
          this.requested = true
          console.log('repair request complete')
          console.log(response)
        })
        .catch((error) => {
          console.log('unable to request repair')
          console.log(error)
        })
    }
  },
  mounted () {
    axios
      .get('http://localhost:8999/payment_due', { params: { email: this.email } })
      .then((response) => {
        console.log(response)
        if (response.data.payment_due != null) {
          this.payment_due = response.data.payment_due
        }
        if (response.data.account_type != null) {
          this.account_type = response.data.account_type
        }
      })
      .catch((error) => {
        console.log(error)
      })
    axios
      .get('http://localhost:8999/brew_history', { params: { email: this.email } })
      .then((response) => {
        this.brew_history = response.data
        if (this.brew_history.length > 3) {
          this.repair = true
        }
      })
      .catch((error) => {
        console.log(error)
      })
  }
}
</script>
