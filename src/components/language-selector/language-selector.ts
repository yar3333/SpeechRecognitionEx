import { Component, Vue, toNative } from 'vue-facing-decorator';
import { SttProvider } from './../../SttProvider';

@Component
class LanguageSelector extends Vue {

    get language() { return SttProvider.sttProvider?.settings?.language }
    set language(v) { SttProvider.onSttLanguageChange(v) }
}
export default toNative(LanguageSelector);
