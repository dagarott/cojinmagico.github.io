$(document).ready(function(){
  //La magia aquí

  // Sample 2
  $('[name="duplicated-name-2"]').paletteColorPicker({
    clear_btn: 'last',
    close_all_but_this: true, // Default is false
  // Callback on change value
      // Callback on change value
      onchange_callback: function( clicked_color ) {
        console.log(clicked_color);
      }
    });
});
