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
            <div v-if="language || language === ''">
                <span>Speech Language</span> </br>
                <select v-model="language">
                    <option value="">-- Automatic --</option>
                    <option value="af">Afrikaans</option>
                    <option value="ar">Arabic</option>
                    <option value="hy">Armenian</option>
                    <option value="az">Azerbaijani</option>
                    <option value="be">Belarusian</option>
                    <option value="bs">Bosnian</option>
                    <option value="bg">Bulgarian</option>
                    <option value="ca">Catalan</option>
                    <option value="zh">Chinese</option>
                    <option value="hr">Croatian</option>
                    <option value="cs">Czech</option>
                    <option value="da">Danish</option>
                    <option value="nl">Dutch</option>
                    <option value="en">English</option>
                    <option value="et">Estonian</option>
                    <option value="fi">Finnish</option>
                    <option value="fr">French</option>
                    <option value="gl">Galician</option>
                    <option value="de">German</option>
                    <option value="el">Greek</option>
                    <option value="he">Hebrew</option>
                    <option value="hi">Hindi</option>
                    <option value="hu">Hungarian</option>
                    <option value="is">Icelandic</option>
                    <option value="id">Indonesian</option>
                    <option value="it">Italian</option>
                    <option value="ja">Japanese</option>
                    <option value="kn">Kannada</option>
                    <option value="kk">Kazakh</option>
                    <option value="ko">Korean</option>
                    <option value="lv">Latvian</option>
                    <option value="lt">Lithuanian</option>
                    <option value="mk">Macedonian</option>
                    <option value="ms">Malay</option>
                    <option value="mr">Marathi</option>
                    <option value="mi">Maori</option>
                    <option value="ne">Nepali</option>
                    <option value="no">Norwegian</option>
                    <option value="fa">Persian</option>
                    <option value="pl">Polish</option>
                    <option value="pt">Portuguese</option>
                    <option value="ro">Romanian</option>
                    <option value="ru">Russian</option>
                    <option value="sr">Serbian</option>
                    <option value="sk">Slovak</option>
                    <option value="sl">Slovenian</option>
                    <option value="es">Spanish</option>
                    <option value="sw">Swahili</option>
                    <option value="sv">Swedish</option>
                    <option value="tl">Tagalog</option>
                    <option value="ta">Tamil</option>
                    <option value="th">Thai</option>
                    <option value="tr">Turkish</option>
                    <option value="uk">Ukrainian</option>
                    <option value="ur">Urdu</option>
                    <option value="vi">Vietnamese</option>
                    <option value="cy">Welsh</option>
                </select>
            </div>
            <div v-show="isShowPttHotkeySelector">
                <span>Recording Hotkey</span>
                <i title="Press the designated keystroke to start the recording. Press again to stop. Only works if a browser tab is in focus."
                   class="fa-solid fa-info-circle opacity50p"></i>
                <input type="text"
                       readonly
                       class="text_pole"
                       placeholder="Click to set push-to-talk key"
                       ref="ptt"
                       @focus="onPttFocus"
                       @blur="onPttBlur">
            </div>
            <div v-if="isShowVoiceActivationCheckbox"
                 title="Automatically start and stop recording when you start and stop speaking.">
                <label class="checkbox_label">
                    <input type="checkbox" v-model="voiceActivationEnabled">
                    <small>Enable activation by voice</small>
                </label>
            </div>
            <div id="speech_recognition_message_mode_div">
                <span>Message Mode</span> </br>
                <select id="speech_recognition_message_mode">
                    <option value="append">Append</option>
                    <option value="replace">Replace</option>
                    <option value="auto_send">Auto send</option>
                </select>
            </div>
            <div id="speech_recognition_message_mapping_div">
                <span>Message Mapping</span>
                <textarea id="speech_recognition_message_mapping" class="text_pole textarea_compact" type="text"
                          rows="4"
                          placeholder="Enter comma separated phrases mapping, example:\ncommand delete = /del 2,\nslash delete = /del 2,\nsystem roll = /roll 2d6,\nhey continue = /continue"></textarea>
                <span id="speech_recognition_message_mapping_status"></span>
                <label class="checkbox_label" for="speech_recognition_message_mapping_enabled">
                    <input type="checkbox" id="speech_recognition_message_mapping_enabled"
                           name="speech_recognition_message_mapping_enabled">
                    <small>Enable messages mapping</small>
                </label>
            </div>
            <form ref="sttProviderSettingsForm" class="inline-drawer-content" v-html="sttProviderSettingsFormInnerHtml">
            </form>
        </div>
    </div>
</template>

<script lang="ts" src="./App.ts"></script>
