export class UiHelper {

    /**
     * Set the microphone icon as active. Must be called when recording starts.
     * @param {JQuery} micButton - The jQuery object of the microphone button.
     */
    public static activateMicIcon(micButton: JQuery) {
        micButton.toggleClass('fa-microphone fa-microphone-slash');
        micButton.prop('title', 'Click to end and transcribe');
    }

    /**
     * Set the microphone icon as inactive. Must be called when recording ends.
     * @param {JQuery} micButton - The jQuery object of the microphone button.
     */
    public static deactivateMicIcon(micButton: JQuery) {
        micButton.toggleClass('fa-microphone fa-microphone-slash');
        micButton.prop('title', 'Click to speak');
    }
}
