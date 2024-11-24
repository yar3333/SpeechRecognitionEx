<template>
    <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
            <b>Speech Recognition Ex</b>
            <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
            <div>
                <span>Select Speech-to-text Provider</span> </br>
                <select v-model="sttProviderName">
                    <option v-for="name in sttProviderNames" :value="name">{{ name }}</option>
                </select>
            </div>

            <language-selector></language-selector>

            <div v-show="isShowPttHotkeySelector">
                <span>Recording Hotkey</span>
                <i title="Press the designated keystroke to start the recording. Press again to stop. Only works if a browser tab is in focus."
                    class="fa-solid fa-info-circle opacity50p"></i>
                <input type="text" readonly class="text_pole" placeholder="Click to set push-to-talk key" ref="ptt"
                    @focus="onPttFocus" @blur="onPttBlur">
            </div>
            <div v-if="isShowVoiceActivationCheckbox"
                title="Automatically start and stop recording when you start and stop speaking.">
                <label class="checkbox_label">
                    <input type="checkbox" v-model="voiceActivationEnabled">
                    <small>Enable activation by voice</small>
                </label>
            </div>
            <div v-if="isShowMessageMode">
                <span>Message Mode</span> </br>
                <select v-model="messageMode">
                    <option value="append">Append</option>
                    <option value="replace">Replace</option>
                    <option value="auto_send">Auto send</option>
                </select>
            </div>
            <div v-if="isShowMessageMapping">
                <span>Message Mapping</span>
                <textarea v-model="messageMappingText" class="text_pole textarea_compact" type="text" rows="4"
                    placeholder="Enter comma separated phrases mapping, example:\ncommand delete = /del 2,\nslash delete = /del 2,\nsystem roll = /roll 2d6,\nhey continue = /continue"></textarea>
                <span>{{ messageMappingStatus }}</span>
                <label class="checkbox_label">
                    <input type="checkbox" v-model="isMessageMappingEnabled"> <small>Enable messages mapping</small>
                </label>
            </div>
            <form class="inline-drawer-content" @input="onSttProviderSettingsChanged"
                v-html="sttProviderSettingsFormInnerHtml">
            </form>
        </div>
    </div>
</template>

<script lang="ts" src="./App.ts"></script>
