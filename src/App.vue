<template src="./App.html"></template>

<script lang="ts">
import { Component, Vue, toNative } from 'vue-facing-decorator';
import { setup } from './setup';

@Component
class App extends Vue {

    mounted() {
        $(() => {
            setup();
        });
    }
}
export default toNative(App);
</script>
