<template>
  <v-app id='home'>
    <v-content>
      <v-container fluid fill-height>
        <v-card>
          <v-card-title>
            Home.Vue
          </v-card-title>
        </v-card>
      </v-container>
    </v-content>
  </v-app>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'Home',
  props: {
    email: String,
    account_type: String
  },
  data: () => ({

  })

}
</script>
